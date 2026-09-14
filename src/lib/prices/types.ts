export type QuoteConfidence = 'high' | 'medium' | 'low' | 'none';

export type QuoteFlag =
  | 'paint'
  | 'spelled'
  | 'parts'
  | 'unusual'
  | 'stale'
  | 'no_comps'
  | 'unpriced';

export type QuoteSource = 'schema' | 'classifieds' | 'hybrid' | 'none';

/** Result of the price engine. Phase 2+ fills this in; UI should tolerate null mids. */
export type Quote = {
  midKeys: number | null;
  lowKeys: number | null;
  highKeys: number | null;
  midRef: number | null;
  confidence: QuoteConfidence;
  flags: QuoteFlag[];
  source: QuoteSource;
};

export function emptyQuote(flags: QuoteFlag[] = ['unpriced']): Quote {
  return {
    midKeys: null,
    lowKeys: null,
    highKeys: null,
    midRef: null,
    confidence: 'none',
    flags,
    source: 'none',
  };
}
