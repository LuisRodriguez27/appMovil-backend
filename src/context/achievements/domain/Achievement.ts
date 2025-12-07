import { uid } from "uid";
import { Rarity, RarityType } from "./value-objects/Rarity";
import { Condition, ConditionProps } from "./value-objects/Condition";

export class Achievement {
  constructor(
    public readonly id: string,
    private title: string,
    private rarity: Rarity,
    private condition: Condition,
    private readonly points: number,
    private description?: string,
    private icon?: string,
    private readonly createdAt: Date = new Date()
  ) { }

  static create(data: Omit<AchievementsPrimitives, 'id' | 'createdAt' | 'points'>): Achievement {
    const rarity = typeof data.rarity === 'string'
      ? new Rarity(data.rarity as RarityType)
      : data.rarity;

    const condition = data.condition instanceof Condition
      ? data.condition
      : Condition.fromPrimitives(data.condition);

    // Los puntos se asignan automáticamente según la rareza
    const points = rarity.getPoints();

    const achievement = new Achievement(
      uid(),
      data.title,
      rarity,
      condition,
      points,
      data.description,
      data.icon
    );

    return achievement;
  }

  static fromPrimitives(data: AchievementsPrimitives): Achievement {
    const rarity = typeof data.rarity === 'string'
      ? new Rarity(data.rarity as RarityType)
      : data.rarity;

    const condition = data.condition instanceof Condition
      ? data.condition
      : Condition.fromPrimitives(data.condition);

    // Los puntos siempre se calculan desde la rareza
    const points = rarity.getPoints();

    return new Achievement(
      data.id,
      data.title,
      rarity,
      condition,
      points,
      data.description,
      data.icon,
      new Date(data.createdAt)
    );
  }

  public update(data: Partial<Omit<AchievementsPrimitives, 'id' | 'createdAt' | 'points'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;

    if (data.rarity !== undefined) {
      this.rarity = typeof data.rarity === 'string'
        ? new Rarity(data.rarity as RarityType)
        : data.rarity;
      // Los puntos se recalculan automáticamente al cambiar la rareza
      // Usamos Object.defineProperty para modificar la propiedad readonly
      Object.defineProperty(this, 'points', {
        value: this.rarity.getPoints(),
        writable: false
      });
    }

    if (data.icon !== undefined) this.icon = data.icon;

    if (data.condition !== undefined) {
      this.condition = data.condition instanceof Condition
        ? data.condition
        : Condition.fromPrimitives(data.condition);
    }
  }

  public toPrimitives(): AchievementsPrimitives {
    return {
      id: this.id,
      title: this.title,
      rarity: this.rarity.value,
      condition: this.condition.toPrimitives(),
      points: this.points,
      description: this.description,
      icon: this.icon,
      createdAt: this.createdAt.toISOString()
    };
  }
}

export type AchievementsPrimitives = {
  id: string;
  title: string;
  rarity: RarityType | Rarity;
  condition: ConditionProps | Condition;
  points: number;  // Los puntos se asignan automáticamente según la rareza
  description?: string;
  icon?: string;
  createdAt: string;
};