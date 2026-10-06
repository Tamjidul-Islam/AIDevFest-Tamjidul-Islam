import { t } from '../i18n/strings.js';

export default function PackagePanel({ lang, tender, statuses, blockers, unreadable, busy, done, onGenerate, onExportCsv }) {
  if (!tender) return null;
  const nameOf = (r) => (lang === 'bn' ? r.title_bn : r.title_en);
  const blocked = blockers.length > 0 || unreadable.length > 0;
  return (
    <section className="card">
      <h2>{t(lang, 'packTitle')}</h2>
      {blocked ? (
        <>
          <p className="error">{t(lang, 'packBlocked')}</p>
          <ul>
            {blockers.map((r) => (
              <li key={r.id}><b>{nameOf(r)}</b>: {t(lang, `reason_${statuses[r.id]}`)}</li>
            ))}
            {unreadable.map((r) => (
              <li key={`u${r.id}`}><b>{nameOf(r)}</b>: {t(lang, 'reason_unreadable')}</li>
            ))}
          </ul>
        </>
      ) : <p className="okmsg">{t(lang, 'packReady')}</p>}
      <div className="actions">
        <button className="primary" disabled={blocked || busy} onClick={onGenerate}>
          {t(lang, 'generate')} ({tender.tender.tender_id}_Package.pdf)
        </button>
        <button className="secondary" onClick={onExportCsv}>{t(lang, 'exportCsv')}</button>
      </div>
      {busy && <p className="hint">{t(lang, 'generating')}</p>}
      {done && !busy && <p className="okmsg">{t(lang, 'genDone')}</p>}
    </section>
  );
}
