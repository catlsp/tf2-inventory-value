import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '@/lib/settings';

export default function OptionsApp() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState('Загрузка…');

  useEffect(() => {
    void getSettings().then((settings) => {
      setApiKey(settings.bptfApiKey);
      setStatus(settings.bptfApiKey ? 'Ключ сохранён локально в браузере' : 'Ключ ещё не задан');
    });
  }, []);

  async function onSave(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    await saveSettings({ bptfApiKey: apiKey });
    setStatus('Сохранено. Откройте инвентарь TF2 — цены подтянутся сами.');
  }

  return (
    <main className="popup options">
      <h1>TF2 Inventory Value</h1>
      <p>
        Ключ берётся на{' '}
        <a href="https://backpack.tf/developer" target="_blank" rel="noreferrer">
          backpack.tf/developer
        </a>
        . Он хранится только в <code>chrome.storage</code> этого браузера и не попадает в git.
      </p>
      <form onSubmit={onSave}>
        <label>
          backpack.tf API key
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="xxxxxxxxxxxxxxxx"
          />
        </label>
        <button type="submit">Сохранить</button>
      </form>
      <p className="disclaimer">{status}</p>
    </main>
  );
}
