export type RarityType = 'comun' | 'especial' | 'epico' | 'legendario';

export class Rarity {
  private static readonly VALID_RARITIES: RarityType[] = [
    'comun', 'especial', 'epico', 'legendario'
  ];

  constructor(public readonly value: RarityType) {
    if (!Rarity.VALID_RARITIES.includes(value)) {
      throw new Error(
        `Rareza inválida: "${value}". Debe ser: ${Rarity.VALID_RARITIES.join(', ')}`
      );
    }
  }

  static isValid(rarity: string): boolean {
    return this.VALID_RARITIES.includes(rarity as RarityType);
  }
}