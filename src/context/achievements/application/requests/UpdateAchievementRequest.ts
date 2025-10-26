import { Condition, ConditionType } from "../../domain/value-objects/Condition";
import { Rarity, RarityType } from "../../domain/value-objects/Rarity";

export class UpdateAchievementRequest {
  constructor(
    public readonly title?: string,
    public readonly description?: string,
    public readonly points?: number,
    public readonly rarity?: RarityType,
    public readonly icon?: string,
    public readonly condition?: ConditionType
  ) {
    this.validate();
  }

  private validate(): void {
    // Validar título si está presente
    if (this.title !== undefined) {
      if (this.title.trim().length === 0) {
        throw new Error('El título no puede estar vacío');
      }
      if (this.title.length > 100) {
        throw new Error('Título no puede exceder 100 caracteres');
      }
    }

    // Validar descripción si está presente
    if (this.description !== undefined) {
      if (this.description.trim().length === 0) {
        throw new Error('La descripción no puede estar vacía');
      }
      if (this.description.length > 500) {
        throw new Error('Descripción no puede exceder 500 caracteres');
      }
    }

    // Validar puntos si está presente
    if (this.points !== undefined) {
      if (typeof this.points !== 'number' || isNaN(this.points)) {
        throw new Error('Puntos debe ser un número válido');
      }
      if (this.points <= 0) {
        throw new Error('Los puntos deben ser un número positivo');
      }
    }

    // Validar rareza si está presente
    if (this.rarity !== undefined && !Rarity.isValid(this.rarity)) {
      throw new Error(
        'Rareza inválida. Debe ser: comun, especial, epico o legendario'
      );
    }

    // Validar puntos según rareza si ambos están presentes
    if (this.points !== undefined && this.rarity !== undefined) {
      this.validatePointsForRarity(this.points, this.rarity);
    }

    // Validar ícono si está presente
    if (this.icon !== undefined && this.icon.trim().length === 0) {
      throw new Error('El ícono no puede estar vacío');
    }

    // Validar condición si está presente
    if (this.condition !== undefined && !Condition.isValid(this.condition)) {
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