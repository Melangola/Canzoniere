const params = new URLSearchParams(window.location.search);
const songPath = params.get("path");
const titleEl = document.getElementById("title");
const songEl = document.getElementById("song");
const youtubeLinkEl = document.getElementById("youtube-link");
const { songsDir, fileNameToTitle, extractChordProTitle, extractStrumPatterns } = window.Canzoniere;

function extractYoutubeUrl(text) {
  const youtubeDirective = text.match(/^\s*\{youtube:\s*([^}]+?)\s*\}\s*$/im);
  if (!youtubeDirective) {
    return null;
  }

  const url = youtubeDirective[1].trim();
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

function buildStrumPatternsSection(patterns) {
  if (patterns.length === 0) {
    return null;
  }

  const beatLabels = ["1", "&", "2", "&", "3", "&", "4", "&"];
  const section = document.createElement("section");
  section.className = "strum-patterns";
  section.setAttribute("aria-label", "Strumming patterns");

  for (const { label, pattern } of patterns) {
    const patternEl = document.createElement("div");
    patternEl.className = "strum-pattern";

    const titleEl = document.createElement("h2");
    titleEl.className = "strum-pattern__title";
    titleEl.textContent = label ? `Strumming ${label}` : "Strumming";
    patternEl.appendChild(titleEl);

    const gridEl = document.createElement("div");
    gridEl.className = "strum-pattern__grid";
    gridEl.style.setProperty("--strum-steps", pattern.length);

    const beatLabelEl = document.createElement("div");
    beatLabelEl.className = "strum-pattern__row-label";
    beatLabelEl.textContent = "Beat";
    gridEl.appendChild(beatLabelEl);

    pattern.forEach((_, index) => {
      const beatEl = document.createElement("span");
      beatEl.className = "strum-pattern__cell strum-pattern__beat";
      beatEl.textContent = beatLabels[index % beatLabels.length];
      gridEl.appendChild(beatEl);
    });

    const strokeLabelEl = document.createElement("div");
    strokeLabelEl.className = "strum-pattern__row-label";
    strokeLabelEl.textContent = "Stroke";
    gridEl.appendChild(strokeLabelEl);

    for (const stroke of pattern) {
      const strokeEl = document.createElement("span");
      strokeEl.className = "strum-pattern__cell strum-pattern__stroke";
      if (stroke === "D") {
        strokeEl.textContent = "↓";
        strokeEl.title = "Downstroke";
        strokeEl.setAttribute("aria-label", "Downstroke");
      } else if (stroke === "U") {
        strokeEl.textContent = "↑";
        strokeEl.title = "Upstroke";
        strokeEl.setAttribute("aria-label", "Upstroke");
      } else {
        strokeEl.textContent = "–";
        strokeEl.title = "Rest";
        strokeEl.setAttribute("aria-label", "Rest");
      }
      gridEl.appendChild(strokeEl);
    }

    patternEl.appendChild(gridEl);
    section.appendChild(patternEl);
  }

  return section;
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

    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(text);
    const formatter = new ChordSheetJS.HtmlDivFormatter();
    const strumPatternsSection = buildStrumPatternsSection(extractStrumPatterns(text));
    songEl.innerHTML = formatter.format(song);

    if (strumPatternsSection) {
      songEl.prepend(strumPatternsSection);
    }
  } catch (error) {
    titleEl.textContent = fileNameToTitle(fileName);
    songEl.textContent = error.message;
  }
}

renderSong(songPath);
