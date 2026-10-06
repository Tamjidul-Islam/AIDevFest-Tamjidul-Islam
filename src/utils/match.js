// Auto-match helper: scores filenames against requirement names using normalized words and requirement IDs.
const normalize = (s) => String(s || '').toLowerCase().replace(/\.pdf$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
const words = (s) => new Set(normalize(s).split(/\s+/).filter((x) => x.length > 2));

export function suggestMatches(requirements, files, currentMatches = {}) {
  const used = new Set(Object.values(currentMatches));
  const suggestions = {};
  for (const req of requirements) {
    if (currentMatches[req.id] !== undefined) continue;
    const reqWords = words(`${req.id} ${req.title_en}`);
    let best = null;
    for (const file of files) {
      if (used.has(file.id) || file.pages === null) continue;
      const text = normalize(file.name);
      const fileWords = words(text);
      let score = 0;
      for (const word of reqWords) if (fileWords.has(word)) score += 3;
      if (text.includes(normalize(req.id))) score += 5;
      const title = normalize(req.title_en);
      if (title && text.includes(title)) score += 8;
      if (!best || score > best.score) best = { fileId: file.id, score };
    }
    if (best && best.score >= 3) { suggestions[req.id] = best.fileId; used.add(best.fileId); }
  }
  return suggestions;
}
