import { PDFDocument } from 'pdf-lib';

export const MAX_FILES = 30;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// True if the bytes contain the PDF header in the first 1 KB.
export function looksLikePdf(bytes) {
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 1024));
  return head.includes('%PDF-');
}

// Returns page count, or null if the PDF cannot be read.
export async function countPages(bytes) {
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return null;
  }
}

// SHA-256 of the file bytes, used to find files with identical content.
export async function sha256(bytes) {
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
