import { t } from '../i18n/strings.js';

export default function PackagePanel({ lang, tender, statuses, blockers, unreadable, busy, done, options, setOptions, onGenerate, onExportCsv }) {
  if (!tender) return null;
  const nameOf = (r) => (lang === 'bn' ? r.title_bn : r.title_en);
  const blocked = blockers.length > 0 || unreadable.length > 0;
  return (
    <section className="card">
      <div className="sectionHead"><h2>{t(lang, 'packTitle')}</h2><span className={`tag ${blocked ? 'req' : 'opt'}`}>{blocked ? t(lang, 'packBlockedShort') : t(lang, 'packReadyShort')}</span></div>
      {blocked ? (
        <>
          <p className="error">{t(lang, 'packBlocked')}</p>
          <ul>
            {blockers.map((r) => <li key={r.id}><b>{nameOf(r)}</b>: {t(lang, `reason_${statuses[r.id]}`)}</li>)}
            {unreadable.map((r) => <li key={`u${r.id}`}><b>{nameOf(r)}</b>: {t(lang, 'reason_unreadable')}</li>)}
          </ul>
        </>
      ) : <p className="okmsg">{t(lang, 'packReady')}</p>}
      <div className="options">
        <label><input type="checkbox" checked={options.includeIndex} onChange={(e) => setOptions((o) => ({ ...o, includeIndex: e.target.checked }))} /> {t(lang, 'includeIndex')}</label>
        <label>{t(lang, 'sealText')} <input value={options.sealText} maxLength={16} placeholder={t(lang, 'sealPlaceholder')} onChange={(e) => setOptions((o) => ({ ...o, sealText: e.target.value }))} /></label>
        <label>{t(lang, 'signatureText')} <input value={options.signatureText} maxLength={60} placeholder={t(lang, 'signaturePlaceholder')} onChange={(e) => setOptions((o) => ({ ...o, signatureText: e.target.value }))} /></label>
      </div>
      <div className="actions">
        <button className="primary" disabled={blocked || busy} onClick={onGenerate}>{t(lang, 'generate')} ({tender.tender.tender_id}_Package.pdf)</button>
        <button className="secondary" onClick={onExportCsv}>{t(lang, 'exportCsv')}</button>
      </div>
      {busy && <p className="hint">{t(lang, 'generating')}</p>}
      {done && !busy && <p className="okmsg">{t(lang, 'genDone')}</p>}
    </section>
  );
}
