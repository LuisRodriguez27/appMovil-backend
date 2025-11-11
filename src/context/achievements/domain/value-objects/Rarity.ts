const VALID_RARITIES = ['common', 'special', 'epic', 'legendary'] as const;

export type RarityType = typeof VALID_RARITIES[number];

export class Rarity {
  private static readonly VALID_RARITIES = VALID_RARITIES;

  private static readonly POINTS_BY_RARITY: Record<RarityType, number> = {
    common: 10,
    special: 25,
    epic: 50,
    legendary: 100
  };

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

  getPoints(): number {
    return Rarity.POINTS_BY_RARITY[this.value];
  }
}