import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons'],
  srcDir: 'src',
  manifestVersion: 3,
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
  },
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    homepage_url: 'https://github.com/catlsp/tf2-inventory-value',
    permissions: ['storage', 'unlimitedStorage'],
    host_permissions: [
      'https://steamcommunity.com/*',
      'https://pricedb.io/*',
    ],
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'tf2-inventory-value@catlsp',
              strict_min_version: '128.0',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
