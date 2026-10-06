import { useState } from 'react';
import { t } from '../i18n/strings.js';

export default function PackagePanel({ lang, tender, statuses, blockers }) {
  const [note, setNote] = useState(false);
  if (!tender) return null;
  const nameOf = (r) => (lang === 'bn' ? r.title_bn : r.title_en);
  return (
    <section className="card">
      <h2>{t(lang, 'packTitle')}</h2>
      {blockers.length > 0 ? (
        <>
          <p className="error">{t(lang, 'packBlocked')}</p>
          <ul>
            {blockers.map((r) => (
              <li key={r.id}><b>{nameOf(r)}</b>: {t(lang, `reason_${statuses[r.id]}`)}</li>
            ))}
          </ul>
        </>
      ) : <p className="okmsg">{t(lang, 'packReady')}</p>}
      <button className="primary" disabled={blockers.length > 0} onClick={() => setNote(true)}>{t(lang, 'generate')}</button>
      {note && blockers.length === 0 && <p className="hint">{t(lang, 'generateSoon')}</p>}
    </section>
  );
}
