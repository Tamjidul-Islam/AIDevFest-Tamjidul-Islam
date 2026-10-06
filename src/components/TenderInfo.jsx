import { useRef } from 'react';
import { t } from '../i18n/strings.js';

export default function TenderInfo({ lang, tender, source, error, onLoadFile }) {
  const input = useRef(null);
  const rows = tender ? [
    ['tenderId', tender.tender.tender_id], ['title', tender.tender.title],
    ['entity', tender.tender.procuring_entity], ['bidder', tender.tender.bidder],
    ['deadline', tender.tender.submission_deadline],
  ] : [];
  return (
    <section className="card">
      <h2>{t(lang, 'tenderInfo')}</h2>
      <input ref={input} type="file" accept=".json,application/json" hidden
        onChange={(e) => { if (e.target.files[0]) onLoadFile(e.target.files[0]); e.target.value = ''; }} />
      <button className="primary" onClick={() => input.current.click()}>{t(lang, 'loadReq')}</button>
      {!tender && !error && <p className="hint">{t(lang, 'loadReqHint')}</p>}
      {tender && <p className="hint">{t(lang, 'reqLoaded', { name: source })}</p>}
      {error && <p className="error">{t(lang, 'reqError', { detail: error })}</p>}
      {tender && (
        <dl className="info">
          {rows.map(([k, v]) => (<div key={k}><dt>{t(lang, k)}</dt><dd>{v}</dd></div>))}
        </dl>
      )}
    </section>
  );
}
