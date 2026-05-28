window.Canzoniere = {
  songsDir: "canzoni",
  fileNameToTitle(fileName) {
    return fileName
      .replace(/\.txt$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};
