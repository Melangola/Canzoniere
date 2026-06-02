function extractStrumPatterns(text) {
  const directives = [];
  const strumDirectivePattern = /\{\s*strum(?:[-\s]+([^:}]+?))?\s*:\s*([^}]*?)\s*\}/gi;
  let match;

  while ((match = strumDirectivePattern.exec(text)) !== null) {
    const label = (match[1] || "").trim();
    const pattern = Array.from(match[2].toUpperCase()).filter((character) => "DU-".includes(character));

    if (pattern.length > 0) {
      directives.push({ label, pattern });
    }
  }

  return directives;
}

window.Canzoniere = {
  songsDir: "canzoni",
  extractStrumPatterns,
  fileNameToTitle(fileName) {
    return fileName
      .replace(/\.txt$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  },
  extractChordProTitle(text, fallbackFileName) {
    const titleDirective = text.match(/^\s*\{(?:title|t):\s*([^}]*?)\s*\}\s*$/im);
    if (titleDirective) {
      return titleDirective[1].trim();
    }

    return window.Canzoniere.fileNameToTitle(fallbackFileName);
  }
};
