import { Condition, ConditionProps } from "../../domain/value-objects/Condition";
import { Rarity, RarityType } from "../../domain/value-objects/Rarity";

export class CreateAchievementRequest {
  constructor(
    public readonly title: string,
    public readonly rarity: RarityType,
    public readonly condition: ConditionProps,
    public readonly description?: string,
    public readonly icon?: string,
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

    if (this.description && this.description.length > 500) {
      throw new Error('Descripción no puede exceder 500 caracteres');
    }

    if (!Rarity.isValid(this.rarity)) {
      throw new Error(
        'Rareza inválida. Debe ser: common, special, epic o legendary'
      );
    }

    if (this.icon && this.icon.trim().length === 0) {
      throw new Error('Ícono no puede estar vacío');
    }

    if (!Condition.isValid(this.condition.type)) {
      throw new Error(
        'Condición inválida. Debe ser: complete_lessons, streak_days, xp_total, complete_course...'
      );
    }
  }
}