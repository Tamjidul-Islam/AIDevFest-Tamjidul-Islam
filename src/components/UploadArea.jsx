import { useRef, useState } from 'react';
import { t } from '../i18n/strings.js';
import { MAX_FILES, MAX_TOTAL_BYTES } from '../utils/pdf.js';

export default function UploadArea({ lang, onFiles }) {
  const input = useRef(null);
  const [drag, setDrag] = useState(false);
  const handle = (list) => { if (list && list.length) onFiles(Array.from(list)); };
  return (
    <section className="card">
      <h2>{t(lang, 'uploadSection')}</h2>
      <div className={`drop ${drag ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}>
        <p>{t(lang, 'uploadHint', { max: MAX_FILES, mb: MAX_TOTAL_BYTES / 1024 / 1024 })}</p>
        <input ref={input} type="file" multiple accept="application/pdf,.pdf" hidden
          onChange={(e) => { handle(e.target.files); e.target.value = ''; }} />
        <button className="primary" onClick={() => input.current.click()}>{t(lang, 'chooseFiles')}</button>
      </div>
    </section>
  );
}
