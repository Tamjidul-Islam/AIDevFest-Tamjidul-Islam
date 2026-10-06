// Save/reopen helpers: sessions are portable JSON files containing tender data, matches, expiry dates, and PDF bytes.
const bytesToBase64 = (bytes) => {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
};

const base64ToBytes = (value) => {
  const binary = atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
};

export async function makeSession({ tender, source, files, matches, expiry, options }) {
  const savedFiles = [];
  for (const f of files) {
    const bytes = new Uint8Array(await f.file.arrayBuffer());
    savedFiles.push({ id: f.id, name: f.name, size: f.size, hash: f.hash, pages: f.pages, bytes: bytesToBase64(bytes) });
  }
  return JSON.stringify({ version: 1, savedAt: new Date().toISOString(), tender, source, files: savedFiles, matches, expiry, options });
}

export function readSession(text) {
  const data = JSON.parse(text);
  if (!data || data.version !== 1 || !data.tender || !Array.isArray(data.files) || !data.matches || !data.expiry) {
    throw new Error('Invalid session file');
  }
  const files = data.files.map((f) => {
    const bytes = base64ToBytes(f.bytes);
    return { ...f, file: new File([bytes], f.name, { type: 'application/pdf' }) };
  });
  return { ...data, files };
}

export function downloadSession(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
