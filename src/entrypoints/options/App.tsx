export default function OptionsApp() {
  return (
    <main className="popup options">
      <h1>TF2 Inventory Value</h1>
      <p>
        Цены подгружаются автоматически с{' '}
        <a href="https://pricedb.io" target="_blank" rel="noreferrer">
          pricedb.io
        </a>
        . Ключ backpack.tf вводить не нужно.
      </p>
      <p>
        Откройте инвентарь TF2 или окно обмена на Steam — оценка появится на странице.
      </p>
      <p className="disclaimer">
        Не связано с Valve / Steam / backpack.tf. Данные инвентаря никуда, кроме вашего браузера и
        публичного прайслиста, не отправляются.
      </p>
    </main>
  );
}
