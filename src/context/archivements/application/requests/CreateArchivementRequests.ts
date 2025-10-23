export class CreateArchivementRequest {
  constructor(
    public readonly title: string,
    public readonly description: string,
    public readonly points: number,
    public readonly rarity: string,
    public readonly icon: string,
    public readonly condition: { type: string; value: number | string }
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Título es requerido');
    }
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Descripción es requerida');
    }
    if (this.points < 0) {
      throw new Error('Puntos deben ser un número positivo');
    }
    if (!this.rarity || this.rarity.trim().length === 0) {
      throw new Error('Rareza es requerida');
    }
    if (!this.icon || this.icon.trim().length === 0) {
      throw new Error('Ícono es requerido');
    }
    if (!this.condition || !this.condition.type || this.condition.value === undefined) {
      throw new Error('Condición es requerida');
    }
  }
}