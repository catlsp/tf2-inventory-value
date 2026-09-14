export type SchemaLookupKeyInput = {
  defindex: number;
  qualityId: number;
  craftable: boolean;
  effectId: number;
  australium: boolean;
};

export function schemaLookupKey(input: SchemaLookupKeyInput): string {
  return `${input.defindex};${input.qualityId};${input.craftable ? 1 : 0};e${input.effectId};au${input.australium ? 1 : 0}`;
}

export function isAustraliumSchemaName(name: string): boolean {
  return /\baustralium\b/i.test(name) && !/australium gold/i.test(name);
}
