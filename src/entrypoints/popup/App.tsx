import { useEffect, useState } from 'react';
import type { StatusResponse } from '@/lib/messages';

export default function App() {
  const [statusText, setStatusText] = useState('Проверяю настройки…');

  useEffect(() => {
    void browser.runtime.sendMessage({ type: 'GET_PRICE_STATUS' }).then((response: StatusResponse) => {
      if (!response.status.hasApiKey) {
        setStatusText('Нужен backpack.tf API key — откройте настройки.');
        return;
      }
      if (response.status.ready) {
        setStatusText(`Прайслист готов · ключ ≈ ${response.status.keyRef?.toFixed(2)} ref`);
        return;
      }
      setStatusText('Ключ есть. Откройте инвентарь TF2, чтобы подтянуть цены.');
    });
  }, []);

  return (
    <main className="popup">
      <h1>TF2 Inventory Value</h1>
      <p>{statusText}</p>
      <ol>
        <li>Сохраните API key backpack.tf в настройках</li>
        <li>Откройте инвентарь TF2 на steamcommunity.com</li>
        <li>На плитках появятся keys/ref; unusual — по эффекту, не как craft-шляпа</li>
      </ol>
      <button type="button" onClick={() => void browser.runtime.openOptionsPage()}>
        Настройки
      </button>
      <p className="disclaimer">
        Не связано с Valve, Steam или backpack.tf. Не запрашивает пароль Steam.
        Краска и спеллы помечаются, но не прибавляются «как банка».
      </p>
    </main>
  );
}
