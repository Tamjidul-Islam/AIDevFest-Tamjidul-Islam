import { t } from '../i18n/strings.js';
export default function NextSteps({ lang, current }) {
  const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
  return (
    <section className="card">
      <h2>{t(lang, 'nextStep')}</h2>
      <ol className="steps">
        {steps.map((k, i) => (
          <li key={k} className={i < current ? 'done' : i === current ? 'now' : ''}>
            {t(lang, k)} {i === current && <b className="here">← {t(lang, 'nowDoing')}</b>}
          </li>
        ))}
      </ol>
    </section>
  );
}
