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
export async function buildPackage(tender, items, options = {}) {
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);

  const sources = [];
  for (const it of items) {
    try {
      const doc = await PDFDocument.load(await it.file.arrayBuffer(), { updateMetadata: false });
      sources.push({ req: it.req, doc, fileName: it.file.name });
    } catch {
      const err = new Error('unreadable'); err.fileName = it.file.name; throw err;
    }
  }

  const sourcePageCount = sources.reduce((s, x) => s + x.doc.getPageCount(), 0);
  const includeIndex = options.includeIndex !== false;
  const total = 1 + (includeIndex ? 1 : 0) + sourcePageCount;
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
  y -= 10;
  if (options.sealText) {
    cover.drawCircle({ x: W - 105, y: H - 125, size: 42, borderWidth: 2, borderColor: rgb(0.1, 0.3, 0.8) });
    cover.drawText(clean(options.sealText).slice(0, 16), { x: W - 138, y: H - 130, size: 9, font: bold });
  }
  if (options.signatureText) {
    cover.drawLine({ start: { x: W - 230, y: 82 }, end: { x: W - 60, y: 82 }, thickness: 1 });
    cover.drawText(clean(options.signatureText), { x: W - 230, y: 65, size: 9, font });
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

  if (includeIndex) {
    // ---- Page 2: index ----
    const index = out.addPage(A4);
    index.drawText('Document Index', { x: 60, y: H - 80, size: 22, font: bold });
    let iy = H - 120;
    index.drawText('#', { x: 60, y: iy, size: 10, font: bold });
    index.drawText('Document', { x: 90, y: iy, size: 10, font: bold });
    index.drawText('File', { x: 330, y: iy, size: 10, font: bold });
    index.drawText('Pages', { x: 500, y: iy, size: 10, font: bold });
    iy -= 18;
    let startPage = 3;
    for (const [i, source] of sources.entries()) {
      const pageCount = source.doc.getPageCount();
      index.drawText(String(i + 1), { x: 60, y: iy, size: 10, font });
      for (const [j, line] of wrap(source.req.title_en, font, 10, 225).entries()) index.drawText(line, { x: 90, y: iy - j * 12, size: 10, font });
      for (const [j, line] of wrap(source.fileName, font, 9, 155).entries()) index.drawText(line, { x: 330, y: iy - j * 11, size: 9, font });
      index.drawText(`${startPage}-${startPage + pageCount - 1}`, { x: 500, y: iy, size: 10, font });
      iy -= Math.max(18, wrap(source.req.title_en, font, 10, 225).length * 12, wrap(source.fileName, font, 9, 155).length * 11) + 8;
      startPage += pageCount;
    }
    footer(index, 2);
  }

  // ---- Documents: each source page is placed on a taller page so the footer never covers content ----
  let n = includeIndex ? 3 : 2;
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
