// Checklist export (bonus): document, file name, pages, expiry date, status
const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
export function checklistCsv(rows) {
  const head = ['Document', 'File name', 'Pages', 'Expiry date', 'Status'];
  return '\uFEFF' + [head, ...rows].map((r) => r.map(q).join(',')).join('\r\n');
}
export function downloadText(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
