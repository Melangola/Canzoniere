const songListEl = document.getElementById("song-list");
const homeMessageEl = document.getElementById("home-message");
const { songsDir, fileNameToTitle, extractChordProTitle } = window.Canzoniere;

function inferGitHubRepo() {
  const { hostname, pathname } = window.location;
  if (!hostname.endsWith(".github.io")) {
    return null;
  }

  const owner = hostname.replace(/\.github\.io$/i, "");
  const pathParts = pathname.split("/").filter(Boolean);
  const repo = pathParts.length > 0 ? pathParts[0] : `${owner}.github.io`;
  return { owner, repo };
}

async function loadSongIndexFromGitHub() {
  const repoInfo = inferGitHubRepo();
  if (!repoInfo) {
    throw new Error("Repository GitHub non rilevato");
  }

  const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${songsDir}`;
  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (!response.ok) {
    throw new Error(`Impossibile leggere ${songsDir} dal repository GitHub`);
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    throw new Error("Risposta GitHub non valida");
  }

  return items
    .map((item) => item && item.name)
    .filter((item) => typeof item === "string" && item.trim().toLowerCase().endsWith(".txt"))
    .sort((a, b) => fileNameToTitle(a).localeCompare(fileNameToTitle(b), undefined, { sensitivity: "base" }));
}

async function loadSongIndexFromManifest() {
  const response = await fetch("songs.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Impossibile caricare songs.json");
  }

  const items = await response.json();
  if (!Array.isArray(items)) {
    throw new Error("songs.json deve contenere un array di file .txt");
  }

  return items
    .filter((item) => typeof item === "string" && item.trim().toLowerCase().endsWith(".txt"))
    .sort((a, b) => fileNameToTitle(a).localeCompare(fileNameToTitle(b), undefined, { sensitivity: "base" }));
}

async function loadSongIndex() {
  try {
    const githubFiles = await loadSongIndexFromGitHub();
    if (githubFiles.length > 0) {
      return githubFiles;
    }
  } catch (error) {
    console.warn(error);
  }

  return loadSongIndexFromManifest();
}

async function getSongDisplayTitle(fileName) {
  try {
    const response = await fetch(`${songsDir}/${fileName}`);
    if (!response.ok) {
      throw new Error(`File non trovato: ${songsDir}/${fileName}`);
    }

    const text = await response.text();
    return extractChordProTitle(text, fileName);
  } catch (error) {
    console.warn(`Impossibile leggere il titolo da ${fileName}`, error);
    return fileNameToTitle(fileName);
  }
}

async function renderHome(songFiles) {
  songListEl.innerHTML = "";

  if (songFiles.length === 0) {
    homeMessageEl.textContent = "Nessuna canzone trovata. Aggiungi i file .txt in canzoni/. Se GitHub Pages non riesce a rilevarli automaticamente, usa songs.json come fallback.";
    homeMessageEl.classList.remove("hidden");
    return;
  }

  homeMessageEl.classList.add("hidden");

  const songs = await Promise.all(
    songFiles.map(async (fileName) => ({
      fileName,
      title: await getSongDisplayTitle(fileName)
    }))
  );

  songs.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

  for (const { fileName, title } of songs) {
    const link = document.createElement("a");
    link.href = `song.html?path=${encodeURIComponent(fileName)}`;
    link.className = "button";
    link.textContent = title;
    songListEl.appendChild(link);
  }
}

async function init() {
  try {
    const songFiles = await loadSongIndex();
    await renderHome(songFiles);
  } catch (error) {
    homeMessageEl.textContent = error.message;
    homeMessageEl.classList.remove("hidden");
  }
}

init();
