import { useEffect, useState } from 'react';
import { parseRequirements } from '../utils/requirements.js';

// Holds the loaded tender. Tries ./requirements.json on start (sample pack copy); user can open another.
export function useTender() {
  const [tender, setTender] = useState(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');

  const loadText = (text, name) => {
    try {
      setTender(parseRequirements(text)); setSource(name); setError('');
    } catch (e) { setError(e.message); }
  };

  const loadFile = async (file) => loadText(await file.text(), file.name);

  useEffect(() => {
    fetch('./requirements.json')
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((txt) => loadText(txt, 'requirements.json'))
      .catch(() => {});
  }, []);

  return { tender, source, error, loadFile };
}
