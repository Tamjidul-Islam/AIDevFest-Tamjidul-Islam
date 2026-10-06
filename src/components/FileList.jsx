import { t } from '../i18n/strings.js';
import { formatSize } from '../utils/pdf.js';

export default function FileList({ lang, files, usedBy, dupNames, onRemove }) {
  const totalPages = files.reduce((s, f) => s + (f.pages || 0), 0);
  const totalSize = files.reduce((s, f) => s + f.size, 0);
  return (
    <section className="card">
      <h2>{t(lang, 'uploadedFiles')}</h2>
      {files.length === 0 ? <p className="hint">{t(lang, 'noFiles')}</p> : (
        <>
          <p className="hint">{t(lang, 'summaryFiles', { n: files.length, p: totalPages })} {t(lang, 'totalSize')}: {formatSize(totalSize)}</p>
          <div className="tablewrap">
            <table>
              <thead>
                <tr><th>{t(lang, 'fileName')}</th><th>{t(lang, 'pages')}</th><th>{t(lang, 'size')}</th><th>{t(lang, 'usedFor')}</th><th></th></tr>
              </thead>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id} className={dupNames[f.id] ? 'dup' : ''}>
                    <td className="fname">{f.name}
                      {f.pages === null && <div className="error small">{t(lang, 'unreadable')}</div>}
                      {dupNames[f.id] && <div className="dupmsg">⚠ {t(lang, 'dupOf', { names: dupNames[f.id] })}</div>}
                    </td>
                    <td>{f.pages === undefined ? t(lang, 'readingFile') : f.pages === null ? t(lang, 'pagesUnknown') : f.pages}</td>
                    <td>{formatSize(f.size)}</td>
                    <td>{usedBy[f.id] ? (lang === 'bn' ? usedBy[f.id].title_bn : usedBy[f.id].title_en) : t(lang, 'notUsed')}</td>
                    <td><button className="danger" onClick={() => onRemove(f.id)}>{t(lang, 'remove')}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
