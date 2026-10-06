import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const FOOT = 34; // height of the white footer band added under every document page
const A4 = [595.28, 841.89];
// Standard PDF fonts only support Latin characters; unsupported ones become '?'
const clean = (s) => String(s ?? '').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');

function wrap(text, font, size, maxW) {
  const words = clean(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) <= maxW || !cur) cur = test;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// items: [{ req, file }] already sorted by requirement order; file needs name + arrayBuffer()
export async function buildPackage(tender, items) {
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);

  const sources = [];
  for (const it of items) {
    try {
      const doc = await PDFDocument.load(await it.file.arrayBuffer(), { updateMetadata: false });
      sources.push({ req: it.req, doc });
    } catch {
      const err = new Error('unreadable'); err.fileName = it.file.name; throw err;
    }
  }
  const total = 1 + sources.reduce((s, x) => s + x.doc.getPageCount(), 0);
  const tid = tender.tender_id;

  const footer = (page, n) => {
    const text = clean(`${tid} | Page ${n} of ${total}`);
    const w = font.widthOfTextAtSize(text, 10);
    page.drawText(text, { x: (page.getWidth() - w) / 2, y: 13, size: 10, font, color: rgb(0, 0, 0) });
  };

  // ---- Page 1: cover (English) ----
  const cover = out.addPage(A4);
  const [W, H] = A4;
  cover.drawText('Tender Document Package', { x: 60, y: H - 90, size: 24, font: bold });
  cover.drawLine({ start: { x: 60, y: H - 102 }, end: { x: W - 60, y: H - 102 }, thickness: 1.5, color: rgb(0.1, 0.3, 0.8) });
  let y = H - 135;
  const fields = [
    ['Tender ID', tid], ['Tender title', tender.title], ['Procuring entity', tender.procuring_entity],
    ['Bidder', tender.bidder], ['Submission deadline', tender.submission_deadline], ['Package date', today()],
  ];
  for (const [label, value] of fields) {
    cover.drawText(label, { x: 60, y, size: 11, font: bold });
    const lines = wrap(value, font, 11, W - 60 - 200);
    lines.forEach((ln, i) => cover.drawText(ln, { x: 200, y: y - i * 15, size: 11, font }));
    y -= Math.max(1, lines.length) * 15 + 7;
  }
  y -= 12;
  cover.drawText('Documents included (in order)', { x: 60, y, size: 14, font: bold });
  y -= 24;
  const avail = y - 60;
  let size = 12, rows;
  for (; size >= 6; size -= 1) {
    rows = sources.map((s, i) => wrap(`${i + 1}. ${s.req.title_en}`, font, size, W - 140));
    if (rows.reduce((n, r) => n + r.length, 0) * (size + 5) <= avail) break;
  }
  for (const lines of rows) for (const ln of lines) { cover.drawText(ln, { x: 70, y, size, font }); y -= size + 5; }
  footer(cover, 1);

  // ---- Documents: each source page is placed on a taller page so the footer never covers content ----
  let n = 2;
  for (const { doc } of sources) {
    for (const src of doc.getPages()) {
      const emb = await out.embedPage(src);
      const w = emb.width, h = emb.height;
      const rot = (((src.getRotation().angle % 360) + 360) % 360);
      let pw = w, ph = h, opts = { x: 0, y: FOOT };
      if (rot === 90) { pw = h; ph = w; opts = { x: 0, y: w + FOOT, rotate: { type: 'degrees', angle: -90 } }; }
      else if (rot === 180) { opts = { x: w, y: h + FOOT, rotate: { type: 'degrees', angle: 180 } }; }
      else if (rot === 270) { pw = h; ph = w; opts = { x: h, y: FOOT, rotate: { type: 'degrees', angle: 90 } }; }
      const page = out.addPage([pw, ph + FOOT]);
      page.drawPage(emb, opts);
      footer(page, n++);
    }
  }
  out.setTitle(`${tid} Package`);
  return out.save();
}

export function downloadBytes(bytes, filename) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
