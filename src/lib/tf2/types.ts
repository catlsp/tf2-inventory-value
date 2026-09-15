export const TF2_APPID = 440;
export const TF2_CONTEXT_ID = '2';

export type ItemQuality =
  | 'Normal'
  | 'Genuine'
  | 'Vintage'
  | 'Unusual'
  | 'Unique'
  | 'Community'
  | 'Developer'
  | 'Self-Made'
  | 'Customized'
  | 'Strange'
  | 'Completed'
  | 'Haunted'
  | "Collector's"
  | 'Decorated'
  | 'Unknown';

export type KillstreakTier = 0 | 1 | 2 | 3;

export type UnusualEffect = {
  id: number | null;
  name: string;
};

export type PaintInfo = {
  defindex: number | null;
  name: string;
};

export type SpellInfo = {
  id: number | null;
  name: string;
};

export type StrangePart = {
  name: string;
  kills?: number;
};

export type ItemPassport = {
  assetid?: string;
  classid?: string;
  instanceid?: string;
  defindex: number | null;
  quality: ItemQuality;
  qualityId: number | null;
  elevatedStrange: boolean;
  name: string;
  marketHashName: string;
  tradable: boolean;
  craftable: boolean;
  australium: boolean;
  festivized: boolean;
  effect: UnusualEffect | null;
  paint: PaintInfo | null;
  spells: SpellInfo[];
  parts: StrangePart[];
  killstreak: KillstreakTier;
  sheen: string | null;
  killstreaker: string | null;
  targetDefindex: number | null;
  outputDefindex: number | null;
  outputQuality: number | null;
  targetName: string | null;
  craftNumber: number | null;
  gifted: boolean;
  countsTowardValue: boolean;
  slot: string | null;
  crateSeries: number | null;
  sku: string | null;
  flags: string[];
};

export type SteamTag = {
  category: string;
  internal_name: string;
  localized_tag_name?: string;
  localized_category_name?: string;
  color?: string;
};

export type SteamDescriptionLine = {
  type?: string;
  value?: string;
  color?: string;
};

export type SteamItemDescription = {
  appid?: number;
  classid?: string;
  instanceid?: string;
  name?: string;
  market_name?: string;
  market_hash_name?: string;
  type?: string;
  tradable?: number;
  marketable?: number;
  descriptions?: SteamDescriptionLine[];
  owner_descriptions?: SteamDescriptionLine[];
  tags?: SteamTag[];
  actions?: Array<{ link?: string; name?: string }>;
  market_actions?: Array<{ link?: string; name?: string }>;
  app_data?: {
    def_index?: string;
    quality?: string;
    [key: string]: string | undefined;
  };
};

export type SteamAsset = {
  appid?: number;
  contextid?: string;
  assetid: string;
  classid: string;
  instanceid: string;
  amount?: string;
};

export type SteamInventoryResponse = {
  assets?: SteamAsset[];
  descriptions?: SteamItemDescription[];
  success?: number;
  more_items?: number;
  last_assetid?: string;
  rwgrsn?: number;
};
