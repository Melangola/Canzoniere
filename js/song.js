const params = new URLSearchParams(window.location.search);
const songPath = params.get("path");
const titleEl = document.getElementById("title");
const songEl = document.getElementById("song");
const youtubeLinkEl = document.getElementById("youtube-link");
const chordsOptionEl = document.getElementById("chords-option");
const chordsToggleEl = document.getElementById("chords-toggle");
const speedOptionEl = document.getElementById("speed-option");
const speedToggleEl = document.getElementById("speed-toggle");
const speedSliderEl = document.getElementById("speed-slider"); // pixels per second
let lastTime = 0; // autoscroll animation
let remainder = 0; // fractions of a pixel
const { songsDir, fileNameToTitle, extractChordProTitle } = window.Canzoniere;

function formatChordText(input) {
  let lines = input.split("\n");

  const root = document.createElement("div");
  root.className = "song";

  //skip empty beginning
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("{") || lines[i].trim() === "") continue;
    //if (lines[i].trim().startsWith("[") && !chordsToggleEl.checked) continue;

    console.log(lines[i])
    lines = lines.slice(i)
    break;
  }

  for (let line of lines) {
    const lineEl = document.createElement("div");
    lineEl.className = "line";

    //if (line.trim().startsWith("{")) continue;

    let hasChord = false;

    const parts = line.split(/(\[[^\]]+\])/g);

    for (let part of parts) {
      const chordMatch = part.match(/^\[([^\]]+)\]$/);

      if (chordMatch) {
        hasChord = true;

        const chord = document.createElement("span");
        chord.className = "chord";
        chord.textContent = chordMatch[1];

        const anchor = document.createElement("span");
        anchor.className = "chord-anchor";
        anchor.appendChild(chord);

        lineEl.appendChild(anchor);
      } else {
        lineEl.appendChild(document.createTextNode(part));
      }
    }

    if (hasChord) lineEl.classList.add("has-chord");

    root.appendChild(lineEl);
  }

  return root.outerHTML;
}

function extractSpeed(text) {
  const speedTag = text.match(/^\s*\{speed:\s*([0-9]+)\s*\}\s*$/im);
  return speedTag ? speedTag : "";
}

function hasChords(text) {
  return /\[[^\]\r\n]+\]/.test(text);
}

function setChordsVisible(visible) {
  songEl.classList.toggle("hide-chords", !visible);
  speedOptionEl.classList.toggle("hidden", !visible);
  if(speedToggleEl.checked && !visible) speedToggleEl.checked = false;
}

function configureOptions({ chordsAvailable, speed }) {
  //default to plain text
  chordsToggleEl.checked = false;
  setChordsVisible(false);
  //speedOptionEl.classList.toggle("hidden", !chordsAvailable);

  // do show the options if cords are available
  chordsOptionEl.classList.toggle("hidden", !chordsAvailable);

  if(speed) speedSliderEl.value = speed;
}

chordsToggleEl.addEventListener("change", () => {
  setChordsVisible(chordsToggleEl.checked);
});

speedToggleEl.addEventListener("change", () => {
  if(speedToggleEl.checked){
    lastTime = 0;
    requestAnimationFrame(step);
  }
});

songEl.addEventListener("dblclick", () => {
  chordsToggleEl.checked = true;
  setChordsVisible(true);

  speedToggleEl.checked = !speedToggleEl.checked;
  if(speedToggleEl.checked){
    lastTime = 0;
    requestAnimationFrame(step);
  }
});

speedSliderEl.addEventListener('change', (e) => {
  console.log('Final value:', e.target.value);
  speedToggleEl.checked = true;
  lastTime = 0;
  requestAnimationFrame(step);
});

function extractYoutubeUrl(text) {
  const youtubeTag = text.match(/^\s*\{youtube:\s*([^}]+?)\s*\}\s*$/im);
  if (!youtubeTag) {
    return null;
  }

  const url = youtubeTag[1].trim();
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isYoutubeUrl = hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be";
    return isYoutubeUrl ? parsedUrl.href : null;
  } catch (error) {
    console.warn(`Direttiva YouTube non valida: ${url}`, error);
    return null;
  }
}

function renderYoutubeLink(url) {
  if (!url) {
    youtubeLinkEl.classList.add("hidden");
    return;
  }

  youtubeLinkEl.href = url;
  youtubeLinkEl.classList.remove("hidden");
}

function step(timestamp) {
    if (!speedToggleEl.checked) return;

    if (!lastTime) {
      lastTime = timestamp;
      remainder = 0;
      console.log(speedSliderEl.value);console.log(document.body.scrollHeight, window.innerHeight);
    }

    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    let pixels = speedSliderEl.value * dt + remainder;
    let integer = Math.floor(pixels);
    if(integer > 1){
      remainder = pixels - integer
      window.scrollBy(0, integer);
    }else{
      remainder = pixels
    }
    
    // Stop at bottom
    if (window.innerHeight + window.scrollY + 4 >= document.body.scrollHeight) {
      speedToggleEl.checked = false;
      return;
    }

    requestAnimationFrame(step);
}

async function renderSong(path) {
  if (!path) {
    titleEl.textContent = "Canzone non selezionata";
    songEl.textContent = "Nessuna canzone selezionata. Torna all'indice e scegli una canzone.";
    return;
  }

  const fileName = path.split("/").pop() || path;

  try {
    const response = await fetch(`${songsDir}/${path}`);
    if (!response.ok) {
      throw new Error(`File non trovato: ${songsDir}/${path}`);
    }
    // TODO save tis text and completely reformat the div according to chordsToggleEl instead of simply hiding and unhiding
    const text = await response.text();
    titleEl.textContent = extractChordProTitle(text, fileName);
    renderYoutubeLink(extractYoutubeUrl(text));
    configureOptions({
      chordsAvailable: hasChords(text),
      speed: extractSpeed(text)
    });

    songEl.innerHTML = formatChordText(text);
  } catch (error) {
    titleEl.textContent = fileNameToTitle(fileName);
    songEl.textContent = error.message;
  }
}

renderSong(songPath);
