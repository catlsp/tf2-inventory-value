import '@/assets/content.css';

function ensurePanel(): void {
  if (document.getElementById('tf2iv-trade-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'tf2iv-trade-panel';
  panel.innerHTML = `
    <h3>TF2 Inventory Value</h3>
    <div>Калькулятор профита оффера появится после слоя цен. Сейчас расширение только распознаёт страницу обмена.</div>
  `;

  const anchor =
    document.querySelector('.trade_area') ??
    document.getElementById('trade_yours') ??
    document.body;
  anchor.prepend(panel);
}

export default defineContentScript({
  matches: [
    '*://steamcommunity.com/tradeoffer/*',
    '*://steamcommunity.com/tradeoffers/*',
  ],
  runAt: 'document_idle',
  main() {
    ensurePanel();
  },
});
