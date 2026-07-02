window.Canzoniere = {
  songsDir: "canzoni",
  fileNameToTitle(fileName) {
    return fileName
      .replace(/\.txt$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },
  extractChordProTitle(text, fallbackFileName) {
    const titleTag = text.match(/^\s*\{(?:title|t):\s*([^}]*?)\s*\}\s*$/im);
    if (titleTag) {
      return titleTag[1].trim();
    }

    return window.Canzoniere.fileNameToTitle(fallbackFileName);
  }
};
