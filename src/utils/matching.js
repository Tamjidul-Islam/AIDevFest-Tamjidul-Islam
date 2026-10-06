// Filename/content helpers for practical matching of real tender files.
const STOP = new Set(['the','and','for','of','to','certificate','document','file','copy','final','signed','latest','new','updated']);

export function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const aliases = [
  ['trade license', ['trade license', 'trade licence', 'tradelicense', 'tradelicence', 'license', 'licence']],
  ['tin certificate', ['tin certificate', 'tin cert', 'tin', 'tax identification']],
  ['vat registration certificate', ['vat registration certificate', 'vat certificate', 'vat registration', 'vat']],
  ['bank solvency certificate', ['bank solvency certificate', 'bank solvency', 'solvency certificate', 'solvency']],
  ['experience certificate', ['experience certificate', 'experience cert', 'experience']],
  ['audited financial statement', ['audited financial statement', 'audited financial', 'financial statement', 'audit report']],
  ["manufacturer's authorization", ["manufacturer's authorization", 'manufacturer authorization', 'manufacturers authorization', 'authorization letter', 'manufacturer']],
  ['technical proposal', ['technical proposal', 'technical bid', 'technical']],
  ['financial proposal', ['financial proposal', 'financial bid', 'financial offer', 'price proposal']],
  ['signed declaration', ['signed declaration', 'declaration', 'sd confirm', 'sd confirmation', 'sd confirm signed']],
];

function tokens(value) { return normalizeName(value).split(/\s+/).filter(Boolean); }

function aliasScore(req, name) {
  const normalized = normalizeName(name);
  const title = normalizeName(req.title_en);
  let score = 0;
  if (normalized.includes(title)) score += 100;
  for (const [key, words] of aliases) {
    if (normalizeName(req.title_en) !== key) continue;
    words.forEach((word) => { if (normalized.includes(normalizeName(word))) score += word.length > 8 ? 65 : 40; });
  }
  const reqTokens = tokens(req.title_en).filter((x) => !STOP.has(x));
  const nameTokens = new Set(tokens(name));
  reqTokens.forEach((x) => { if (nameTokens.has(x)) score += 12; });
  return score;
}

function recencyScore(name) {
  const normalized = normalizeName(name);
  let score = 0;
  const years = normalized.match(/\b(?:19|20)\d{2}\b/g)?.map(Number) || [];
  if (years.length) score += Math.max(...years) - 2000;
  if (/updated|latest|renewed|current|new/.test(normalized)) score += 80;
  if (/old|expired|previous|copy old/.test(normalized)) score -= 80;
  return score;
}

export function matchFilesToRequirements(requirements, files) {
  const result = {};
  const used = new Set();
  const sortedReqs = [...requirements].sort((a, b) => a.order - b.order);
  for (const req of sortedReqs) {
    const candidates = files
      .filter((f) => !used.has(f.id))
      .map((file) => ({ file, score: aliasScore(req, file.name) + recencyScore(file.name) }))
      .filter((x) => x.score >= 30)
      .sort((a, b) => b.score - a.score);
    if (candidates.length) {
      result[req.id] = candidates[0].file.id;
      used.add(candidates[0].file.id);
    }
  }
  return result;
}

function decodePdfText(bytes) {
  // Most ordinary text in PDFs remains visible in a latin-1 decoding even when
  // the PDF uses compressed streams. This intentionally stays dependency-free.
  return new TextDecoder('latin1').decode(bytes)
    .replace(/\\([()\\])/g, '$1')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r');
}

function toIsoDate(day, month, year) {
  const d = Number(day), m = Number(month), y = Number(year);
  if (!d || !m || !y || d > 31 || m > 12) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function extractExpiryDate(bytes, fileName = '') {
  const text = `${decodePdfText(bytes)}\n${fileName}`;
  const dates = [];
  const push = (iso, index, context) => { if (iso) dates.push({ iso, index, context }); };

  for (const m of text.matchAll(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/g))
    push(toIsoDate(m[3], m[2], m[1]), m.index, text.slice(Math.max(0, m.index - 60), m.index + 80).toLowerCase());
  for (const m of text.matchAll(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2})\b/g))
    push(toIsoDate(m[1], m[2], m[3]), m.index, text.slice(Math.max(0, m.index - 60), m.index + 80).toLowerCase());
  for (const m of text.matchAll(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(20\d{2})\b/gi)) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mo = months.findIndex((x) => m[2].toLowerCase().startsWith(x)) + 1;
    push(toIsoDate(m[1], mo, m[3]), m.index, text.slice(Math.max(0, m.index - 60), m.index + 100).toLowerCase());
  }
  if (!dates.length) return '';

  const priority = dates.filter((d) => /valid|expiry|expire|expires|expiration|validity|upto|up to|until|renew/.test(d.context));
  const pool = priority.length ? priority : dates;
  return pool.sort((a, b) => a.iso.localeCompare(b.iso))[pool.length - 1].iso;
}
