import { useEffect, useState } from 'react';
import type { StatusResponse } from '@/lib/messages';

export default function App() {
  const [statusText, setStatusText] = useState('Загружаю прайслист…');

  useEffect(() => {
    void browser.runtime.sendMessage({ type: 'REFRESH_PRICES' }).then((response: StatusResponse) => {
      if ('status' in response && response.status.ready) {
        setStatusText(`Цены готовы · ключ ≈ ${response.status.keyRef?.toFixed(2)} ref`);
        return;
      }
      setStatusText('Откройте инвентарь TF2 на Steam — цены подтянутся сами.');
    }).catch(() => {
      setStatusText('Откройте инвентарь TF2 на Steam — цены подтянутся сами.');
    });
  }, []);

  return (
    <main className="popup">
      <h1>TF2 Inventory Value</h1>
      <p>{statusText}</p>
      <ol>
        <li>Откройте инвентарь Team Fortress 2 на steamcommunity.com</li>
        <li>На предметах появятся keys/ref, сверху — сумма рюкзака</li>
        <li>В окне обмена видно, кто отдаёт дороже</li>
      </ol>
      <p className="disclaimer">
        Неофициальный инструмент, не связан с Valve, Steam и backpack.tf. Пароль Steam не нужен.
        Краска и Halloween spells помечаются, но не прибавляются «как банка».
      </p>
    </main>
  );
}
