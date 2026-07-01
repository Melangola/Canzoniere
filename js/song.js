const params = new URLSearchParams(window.location.search);
const songPath = params.get("path");
const titleEl = document.getElementById("title");
const songEl = document.getElementById("song");
const youtubeLinkEl = document.getElementById("youtube-link");
const { songsDir, fileNameToTitle, extractChordProTitle } = window.Canzoniere;

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
    console.log(song);
    const formatter = new ChordSheetJS.HtmlDivFormatter();
    songEl.innerHTML = formatter.format(song);
  } catch (error) {
    titleEl.textContent = fileNameToTitle(fileName);
    songEl.textContent = error.message;
  }
}

renderSong(songPath);
