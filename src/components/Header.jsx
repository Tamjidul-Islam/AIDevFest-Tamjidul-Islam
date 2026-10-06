import { t } from '../i18n/strings.js';
export default function Header({ lang, setLang }) {
  return (
    <header className="header">
      <div>
        <h1>{t(lang, 'appTitle')}</h1>
        <p>{t(lang, 'appSubtitle')}</p>
      </div>
      <div className="lang" role="group" aria-label={t(lang, 'language')}>
        <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>English</button>
        <button className={lang === 'bn' ? 'active' : ''} onClick={() => setLang('bn')}>বাংলা</button>
      </div>
    </header>
  );
}
