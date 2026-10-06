import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import TenderInfo from './components/TenderInfo.jsx';
import RequirementsList from './components/RequirementsList.jsx';
import UploadArea from './components/UploadArea.jsx';
import FileList from './components/FileList.jsx';
import NextSteps from './components/NextSteps.jsx';
import PackagePanel from './components/PackagePanel.jsx';
import { useTender } from './data/useTender.js';
import { t } from './i18n/strings.js';
import { MAX_FILES, MAX_TOTAL_BYTES, looksLikePdf, countPages, sha256 } from './utils/pdf.js';
import { computeStatus, BLOCKING } from './utils/status.js';
import { buildPackage, downloadBytes } from './utils/package.js';
import { checklistCsv, downloadText } from './utils/csv.js';
import { makeSession, readSession, downloadSession } from './utils/session.js';
import { suggestMatches } from './utils/match.js';

let nextId = 1;

export default function App() {
  const [lang, setLang] = useState('en');
  const { tender, source, error, loadFile } = useTender();
  // files: { id, name, size, hash, file, pages (undefined=reading, null=unreadable, number) }
  const [files, setFiles] = useState([]);
  const [matches, setMatches] = useState({}); // requirementId -> fileId
  const [expiry, setExpiry] = useState({}); // requirementId -> 'YYYY-MM-DD'
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [messages, setMessages] = useState([]); // { id, key, params } translated at render time
  const [packageOptions, setPackageOptions] = useState({ includeIndex: true, sealText: '', signatureText: '' });
  const [helpOpen, setHelpOpen] = useState(false);

  const addMessage = (key, params) => setMessages((m) => [...m, { id: nextId++, key, params }]);

  const handleFiles = async (incoming) => {
    let count = files.length;
    let total = files.reduce((s, f) => s + f.size, 0);
    for (const file of incoming) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const isPdfName = file.name.toLowerCase().endsWith('.pdf');
      if (!(isPdfName || file.type === 'application/pdf') || !looksLikePdf(bytes)) {
        addMessage('errNotPdf', { name: file.name }); continue;
      }
      if (count >= MAX_FILES) { addMessage('errTooMany', { name: file.name, max: MAX_FILES }); continue; }
      if (total + file.size > MAX_TOTAL_BYTES) {
        addMessage('errTooBig', { name: file.name, mb: MAX_TOTAL_BYTES / 1024 / 1024 }); continue;
      }
      count += 1; total += file.size;
      const id = nextId++;
      const hash = await sha256(bytes);
      setFiles((f) => [...f, { id, name: file.name, size: file.size, hash, file, pages: undefined }]);
      countPages(bytes).then((pages) => setFiles((f) => f.map((x) => (x.id === id ? { ...x, pages } : x))));
    }
  };

  const removeFile = (id) => {
    setFiles((f) => f.filter((x) => x.id !== id));
    const reqIds = Object.keys(matches).filter((r) => matches[r] === id);
    if (reqIds.length) {
      setMatches((m) => { const n = { ...m }; reqIds.forEach((r) => delete n[r]); return n; });
      setExpiry((e) => { const n = { ...e }; reqIds.forEach((r) => delete n[r]); return n; });
    }
  };

  const dupGroups = useMemo(() => {
    const g = {};
    files.forEach((f) => { (g[f.hash] = g[f.hash] || []).push(f.id); });
    return g;
  }, [files]);

  const dupNames = useMemo(() => {
    const out = {};
    files.forEach((f) => {
      const others = files.filter((o) => o.hash === f.hash && o.id !== f.id);
      if (others.length) out[f.id] = others.map((o) => o.name).join(', ');
    });
    return out;
  }, [files]);

  const onMatch = (reqId, value) => {
    if (value === '') {
      setMatches((m) => { const n = { ...m }; delete n[reqId]; return n; });
      setExpiry((e) => { const n = { ...e }; delete n[reqId]; return n; });
      return;
    }
    const fileId = Number(value);
    const f = files.find((x) => x.id === fileId);
    const clash = Object.entries(matches).some(([rid, fid]) =>
      rid !== reqId && (fid === fileId || (dupGroups[f.hash] || []).includes(fid)));
    if (clash) { addMessage('errDupMatched', { name: f.name }); return; }
    if (matches[reqId] !== fileId) setExpiry((e) => { const n = { ...e }; delete n[reqId]; return n; });
    setMatches((m) => ({ ...m, [reqId]: fileId }));
  };

  const onExpiry = (reqId, value) => setExpiry((e) => ({ ...e, [reqId]: value }));

  const onAutoMatch = () => {
    const suggestions = suggestMatches(reqs, files, matches);
    Object.entries(suggestions).forEach(([reqId, fileId]) => {
      const f = files.find((x) => x.id === fileId);
      if (f) setMatches((m) => ({ ...m, [reqId]: fileId }));
    });
    const count = Object.keys(suggestions).length;
    if (!count) addMessage('autoMatchNone', {});
    else addMessage('autoMatchDone', { n: count });
  };

  const onSaveSession = async () => {
    try {
      if (!tender) return;
      const text = await makeSession({ tender, source, files, matches, expiry, options: packageOptions });
      downloadSession(text, `${tender.tender.tender_id}_Session.json`);
    } catch { addMessage('sessionSaveError', {}); }
  };

  const onOpenSession = async (file) => {
    try {
      const data = readSession(await file.text());
      setFiles(data.files); setMatches(data.matches); setExpiry(data.expiry);
      setPackageOptions(data.options || { includeIndex: true, sealText: '', signatureText: '' });
      loadFile(new File([JSON.stringify(data.tender)], 'requirements.json', { type: 'application/json' }));
      addMessage('sessionOpenDone', {});
    } catch { addMessage('sessionOpenError', {}); }
  };

  const onGenerate = async () => {
    setBusy(true); setDone(false);
    try {
      const items = reqs.filter((r) => matches[r.id] !== undefined)
        .map((r) => ({ req: r, file: files.find((x) => x.id === matches[r.id]).file }));
      const bytes = await buildPackage(tender.tender, items, packageOptions);
      downloadBytes(bytes, `${tender.tender.tender_id.replace(/[\\/:*?"<>|]/g, '_')}_Package.pdf`);
      setDone(true);
    } catch (e) {
      if (e.fileName) addMessage('genError', { name: e.fileName }); else addMessage('genErrorGeneral', {});
    } finally { setBusy(false); }
  };

  const onExportCsv = () => {
    const rows = reqs.map((r) => {
      const f = files.find((x) => x.id === matches[r.id]);
      return [lang === 'bn' ? r.title_bn : r.title_en, f ? f.name : '', f && f.pages ? f.pages : '',
        expiry[r.id] || '', t(lang, `st_${statuses[r.id]}`)];
    });
    downloadText(checklistCsv(rows), `${tender.tender.tender_id}_Checklist.csv`);
  };

  const reqs = tender ? tender.requirements : [];
  const statuses = {};
  reqs.forEach((r) => {
    const f = files.find((x) => x.id === matches[r.id]);
    statuses[r.id] = computeStatus(r, f, expiry[r.id], tender.tender.submission_deadline);
  });
  const blockers = reqs.filter((r) => BLOCKING.has(statuses[r.id]));
  const usedBy = {};
  reqs.forEach((r) => { if (matches[r.id] !== undefined) usedBy[matches[r.id]] = r; });

  const unreadable = reqs.filter((r) => {
    const f = files.find((x) => x.id === matches[r.id]);
    return f && f.pages === null;
  });

  const step = !tender ? 0 : files.length === 0 ? 1
    : reqs.some((r) => statuses[r.id] === 'missing') ? 2 : blockers.length ? 3 : 4;

  return (
    <div className="app">
      <Header lang={lang} setLang={setLang} />
      <main>
        {messages.length > 0 && (
          <div className="messages">
            {messages.map((m) => (
              <div key={m.id} className="msg">
                <span>{t(lang, m.key, m.params)}</span>
                <button onClick={() => setMessages((x) => x.filter((y) => y.id !== m.id))}>{t(lang, 'dismiss')}</button>
              </div>
            ))}
          </div>
        )}
        <NextSteps lang={lang} current={step} />
        <section className="card toolbar">
          <button className="secondary" onClick={onSaveSession} disabled={!tender}>{t(lang, 'saveSession')}</button>
          <label className="secondary fileButton">{t(lang, 'openSession')}<input type="file" accept=".json,application/json" hidden onChange={(e) => { if (e.target.files[0]) onOpenSession(e.target.files[0]); e.target.value = ''; }} /></label>
          <span className="hint">{t(lang, 'sessionHint')}</span>
        </section>
        <TenderInfo lang={lang} tender={tender} source={source} error={error} onLoadFile={loadFile} />
        <UploadArea lang={lang} onFiles={handleFiles} />
        <FileList lang={lang} files={files} usedBy={usedBy} dupNames={dupNames} onRemove={removeFile} />
        <RequirementsList lang={lang} tender={tender} files={files} matches={matches} expiry={expiry}
          statuses={statuses} dupGroups={dupGroups} onMatch={onMatch} onExpiry={onExpiry} onAutoMatch={onAutoMatch} />
        <PackagePanel lang={lang} tender={tender} statuses={statuses} blockers={blockers} unreadable={unreadable}
          busy={busy} done={done} options={packageOptions} setOptions={setPackageOptions}
          onGenerate={onGenerate} onExportCsv={onExportCsv} onSaveSession={onSaveSession} onOpenSession={onOpenSession} />
        <section className="card help-card">
          <button className="secondary" onClick={() => setHelpOpen((x) => !x)}>{t(lang, helpOpen ? 'hideHelp' : 'showHelp')}</button>
          {helpOpen && <div className="help"><h2>{t(lang, 'helpTitle')}</h2><p>{t(lang, 'helpText')}</p><ul><li>{t(lang, 'help1')}</li><li>{t(lang, 'help2')}</li><li>{t(lang, 'help3')}</li><li>{t(lang, 'help4')}</li></ul></div>}
        </section>
      </main>
    </div>
  );
}
