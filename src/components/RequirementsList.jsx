import { t } from '../i18n/strings.js';

export default function RequirementsList({ lang, tender, files, matches, expiry, statuses, dupGroups, onMatch, onExpiry }) {
  if (!tender) return null;
  const usedElsewhere = (reqId, fileId) =>
    Object.entries(matches).some(([rid, fid]) => rid !== reqId && fid === fileId);
  // a file is blocked if it, or a duplicate of it, is already matched to another document
  const blocked = (reqId, f) =>
    usedElsewhere(reqId, f.id) ||
    (dupGroups[f.hash] || []).some((o) => o !== f.id && usedElsewhere(reqId, o));
  return (
    <section className="card">
      <h2>{t(lang, 'reqSection')}</h2>
      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>{t(lang, 'colOrder')}</th><th>{t(lang, 'colDoc')}</th><th>{t(lang, 'colType')}</th>
              <th>{t(lang, 'colFile')}</th><th>{t(lang, 'colExpiry')}</th><th>{t(lang, 'colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {tender.requirements.map((r) => {
              const matched = matches[r.id];
              const st = statuses[r.id];
              return (
                <tr key={r.id}>
                  <td>{r.order}</td>
                  <td>{lang === 'bn' ? r.title_bn : r.title_en}</td>
                  <td><span className={`tag ${r.mandatory ? 'req' : 'opt'}`}>{t(lang, r.mandatory ? 'mandatory' : 'optional')}</span></td>
                  <td>
                    <select value={matched ?? ''} onChange={(e) => onMatch(r.id, e.target.value)}>
                      <option value="">{t(lang, 'noMatch')}</option>
                      {files.filter((f) => f.id === matched || !usedElsewhere(r.id, f.id)).map((f) => {
                        const dis = f.id !== matched && blocked(r.id, f);
                        return <option key={f.id} value={f.id} disabled={dis}>{f.name}{dis ? ` (${t(lang, 'dupTag')})` : ''}</option>;
                      })}
                    </select>
                    {matched !== undefined && (
                      <button className="link" onClick={() => onMatch(r.id, '')}>{t(lang, 'clearMatch')}</button>
                    )}
                  </td>
                  <td>
                    {r.has_expiry
                      ? <input type="date" aria-label={t(lang, 'expiryDate')} disabled={matched === undefined}
                          value={expiry[r.id] || ''} onChange={(e) => onExpiry(r.id, e.target.value)} />
                      : '—'}
                  </td>
                  <td><span className={`tag st-${st}`}>{t(lang, `st_${st}`)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
