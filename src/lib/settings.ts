import { storage } from 'wxt/utils/storage';

const SETTINGS_KEY = 'tf2iv.settings';
const CACHE_KEY = 'tf2iv.priceCache';

export type ExtensionSettings = {
  bptfApiKey: string;
};

export type PriceCache = {
  fetchedAt: number;
  keyRef: number;
  index: Record<string, {
    value: number;
    valueHigh?: number;
    currency: 'keys' | 'metal' | 'usd' | 'hat';
    lastUpdate: number;
  }>;
};

const DEFAULT_SETTINGS: ExtensionSettings = {
  bptfApiKey: '',
};

export async function getSettings(): Promise<ExtensionSettings> {
  const stored = await storage.getItem<ExtensionSettings>(`local:${SETTINGS_KEY}`);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await storage.setItem(`local:${SETTINGS_KEY}`, {
    bptfApiKey: settings.bptfApiKey.trim(),
  });
}

export async function getPriceCache(): Promise<PriceCache | null> {
  return (await storage.getItem<PriceCache>(`local:${CACHE_KEY}`)) ?? null;
}

export async function savePriceCache(cache: PriceCache): Promise<void> {
  await storage.setItem(`local:${CACHE_KEY}`, cache);
}
