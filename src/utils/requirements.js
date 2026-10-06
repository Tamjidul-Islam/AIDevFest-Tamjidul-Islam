// Parses and validates requirements.json (any pack in the same format).
export function parseRequirements(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('Invalid JSON'); }
  const tender = data && data.tender;
  if (!tender || typeof tender !== 'object') throw new Error('Missing "tender"');
  if (!Array.isArray(data.requirements)) throw new Error('Missing "requirements" list');
  const requirements = data.requirements
    .map((r, i) => ({
      id: String(r.id ?? `R${i + 1}`),
      order: Number(r.order ?? i + 1),
      title_en: String(r.title_en ?? r.title_bn ?? r.id ?? ''),
      title_bn: String(r.title_bn ?? r.title_en ?? r.id ?? ''),
      mandatory: r.mandatory === true,
      has_expiry: r.has_expiry === true,
    }))
    .sort((a, b) => a.order - b.order);
  return {
    tender: {
      tender_id: String(tender.tender_id ?? ''),
      title: String(tender.title ?? ''),
      procuring_entity: String(tender.procuring_entity ?? ''),
      bidder: String(tender.bidder ?? ''),
      submission_deadline: String(tender.submission_deadline ?? ''),
    },
    requirements,
  };
}
