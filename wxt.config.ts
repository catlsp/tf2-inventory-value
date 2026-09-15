import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  srcDir: 'src',
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: {
    name: 'TF2 Inventory Value',
    description:
      'Unofficial TF2 overlay: item values in keys/ref on Steam inventory and trade offers, including unusual effects, paint, and spells.',
    permissions: ['storage'],
    host_permissions: [
      'https://steamcommunity.com/*',
      'https://pricedb.io/*',
    ],
  },
});
