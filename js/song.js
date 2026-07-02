const params = new URLSearchParams(window.location.search);
const songPath = params.get("path");
const titleEl = document.getElementById("title");
const songEl = document.getElementById("song");
const youtubeLinkEl = document.getElementById("youtube-link");
const chordsOptionEl = document.getElementById("chords-option");
const chordsToggleEl = document.getElementById("chords-toggle");
const scrollOptionEl = document.getElementById("scroll-option");
const scrollSpeedEl = document.getElementById("scroll-speed");
const scrollSpeedValueEl = document.getElementById("scroll-speed-value");
const { songsDir, fileNameToTitle, extractChordProTitle } = window.Canzoniere;

let scrollAnimationFrame = null;
let lastScrollTimestamp = null;

function formatChordText(input) {
  const lines = input.split("\n");

  const root = document.createElement("div");
  root.className = "song";

  for (let line of lines) {
    const lineEl = document.createElement("div");
    lineEl.className = "line";

    if (line.trim().startsWith("{")) continue;

    let hasChord = false;

    // Replace [C], [Am], etc.
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
  const speedTag = text.match(/^\s*\{speed:\s*([0-9]+(?:\.[0-9]+)?)\s*\}\s*$/im);
  return speedTag ? Number.parseFloat(speedTag[1]) : 0;
}

function hasChords(text) {
  return /\[[^\]\r\n]+\]/.test(text);
}

function setChordsVisible(visible) {
  songEl.classList.toggle("hide-chords", !visible);
}

function updateScrollSpeedValue(speed) {
  scrollSpeedValueEl.textContent = Number(speed).toFixed(1).replace(/\.0$/, "");
}

function stopAutoScroll() {
  if (scrollAnimationFrame !== null) {
    window.cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = null;
  }
  lastScrollTimestamp = null;
}

function autoScrollStep(timestamp) {
  const speed = Number.parseFloat(scrollSpeedEl.value) || 0;
  if (speed <= 0) {
    stopAutoScroll();
    return;
  }

  if (lastScrollTimestamp !== null) {
    const elapsedSeconds = (timestamp - lastScrollTimestamp) / 1000;
    window.scrollBy(0, speed * elapsedSeconds);
  }

  lastScrollTimestamp = timestamp;

  const reachedBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
  if (reachedBottom) {
    stopAutoScroll();
    return;
  }

  scrollAnimationFrame = window.requestAnimationFrame(autoScrollStep);
}

function startAutoScroll() {
  stopAutoScroll();
  if ((Number.parseFloat(scrollSpeedEl.value) || 0) > 0) {
    scrollAnimationFrame = window.requestAnimationFrame(autoScrollStep);
  }
}

function configureOptions({ chordsAvailable, speed }) {
  chordsToggleEl.checked = false;
  setChordsVisible(false);
  chordsOptionEl.classList.toggle("hidden", !chordsAvailable);

  //const safeSpeed = Number.isFinite(speed) ? Math.min(Math.max(speed, 0), Number(scrollSpeedEl.max)) : 0;
  //scrollSpeedEl.value = safeSpeed;
  //updateScrollSpeedValue(safeSpeed);
  //scrollOptionEl.classList.remove("hidden");
  //startAutoScroll();
}

function resetOptions() {
  stopAutoScroll();
  chordsOptionEl.classList.add("hidden");
  scrollOptionEl.classList.add("hidden");
  scrollSpeedEl.value = 0;
  updateScrollSpeedValue(0);
  setChordsVisible(true);
}

chordsToggleEl.addEventListener("change", () => {
  setChordsVisible(chordsToggleEl.checked);
});

scrollSpeedEl.addEventListener("input", () => {
  updateScrollSpeedValue(scrollSpeedEl.value);
  startAutoScroll();
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
    youtubeLinkEl.removeAttribute("href");
    return;
  }

  youtubeLinkEl.href = url;
  youtubeLinkEl.classList.remove("hidden");
}

async function renderSong(path) {
  renderYoutubeLink(null);
  resetOptions();

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
