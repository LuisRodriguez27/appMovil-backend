import { Condition, ConditionProps } from "../../domain/value-objects/Condition";
import { Rarity, RarityType } from "../../domain/value-objects/Rarity";

export class UpdateAchievementRequest {
  constructor(
    public readonly title?: string,
    public readonly rarity?: RarityType,
    public readonly condition?: ConditionProps,
    public readonly description?: string,
    public readonly icon?: string,
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
      if (this.description.length > 500) {
        throw new Error('Descripción no puede exceder 500 caracteres');
      }
    }

    // Validar rareza si está presente
    if (this.rarity !== undefined && !Rarity.isValid(this.rarity)) {
      throw new Error(
        'Rareza inválida. Debe ser: comun, especial, epico o legendario'
      );
    }

    // Validar ícono si está presente
    if (this.icon !== undefined && this.icon.trim().length === 0) {
      throw new Error('El ícono no puede estar vacío');
    }

    // Validar condición si está presente
    if (this.condition !== undefined && !Condition.isValid(this.condition.type)) {
      throw new Error(
        'Condición inválida. Debe ser: complete_lessons, streak_days, xp_total, complete_course...'
      );
    }
  }
}