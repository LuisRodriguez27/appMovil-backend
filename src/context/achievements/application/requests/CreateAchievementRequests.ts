import { Condition, ConditionType } from "../../domain/value-objects/Condition";
import { Rarity, RarityType } from "../../domain/value-objects/Rarity";

export class CreateAchievementRequest {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly points: number,
    public readonly rarity: RarityType,
    public readonly icon: string,
    public readonly condition: ConditionType
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar título
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Título es requerido');
    }
    if (this.title.length > 100) {
      throw new Error('Título no puede exceder 100 caracteres');
    }

    // Validar descripción
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Descripción es requerida');
    }
    if (this.description.length > 500) {
      throw new Error('Descripción no puede exceder 500 caracteres');
    }

    // Validar puntos
    if (typeof this.points !== 'number' || isNaN(this.points)) {
      throw new Error('Puntos debe ser un número válido');
    }
    if (this.points <= 0) {
      throw new Error('Puntos deben ser un número positivo');
    }

    // Validar rareza
    if (!Rarity.isValid(this.rarity)) {
      throw new Error(
        'Rareza inválida. Debe ser: comun, especial, epico o legendario'
      );
    }

    // Validar puntos según rareza
    this.validatePointsForRarity(this.points, this.rarity);

    // Validar ícono
    if (!this.icon || this.icon.trim().length === 0) {
      throw new Error('Ícono es requerido');
    }

    // Validar condición
    if (!Condition.isValid(this.condition)) {
      throw new Error(
        'Condición inválida. Debe ser: complete_lessons, streak_days, xp_total, complete_course o perfect_score'
      );
    }
  }

  private validatePointsForRarity(points: number, rarity: RarityType): void {
    const ranges: Record<RarityType, { min: number; max?: number }> = {
      comun: { min: 25, max: 50 },
      especial: { min: 50, max: 100 },
      epico: { min: 250, max: 500 },
      legendario: { min: 500 }
    };

    const range = ranges[rarity];
    if (points < range.min || (range.max && points > range.max)) {
      throw new Error(
        `Puntos inválidos para rareza ${rarity}. ` +
        `Debe estar entre ${range.min}${range.max ? `-${range.max}` : '+'} XP`
      );
    }
  }
}