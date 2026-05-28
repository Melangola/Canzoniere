const params = new URLSearchParams(window.location.search);
const songPath = params.get("path");
const titleEl = document.getElementById("title");
const songEl = document.getElementById("song");
const { songsDir, fileNameToTitle } = window.Canzoniere;

async function renderSong(path) {
  if (!path) {
    titleEl.textContent = "Canzone non selezionata";
    songEl.textContent = "Nessuna canzone selezionata. Torna all'indice e scegli una canzone.";
    return;
  }

  const fileName = path.split("/").pop() || path;
  titleEl.textContent = fileNameToTitle(fileName);

  try {
    const response = await fetch(`${songsDir}/${path}`);
    if (!response.ok) {
      throw new Error(`File non trovato: ${songsDir}/${path}`);
    }

    const text = await response.text();
    const parser = new ChordSheetJS.ChordProParser();
    const song = parser.parse(text);
    const formatter = new ChordSheetJS.HtmlDivFormatter();
    songEl.innerHTML = formatter.format(song);
  } catch (error) {
    songEl.textContent = error.message;
  }
}

renderSong(songPath);
