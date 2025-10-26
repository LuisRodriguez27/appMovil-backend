import { uid } from "uid";
import { Rarity, RarityType } from "./value-objects/Rarity";
import { Condition, ConditionType } from "./value-objects/Condition";

export class Achievement {
  constructor(
    public readonly id: string,
    private title: string,
    private description: string,
    private points: number,
    private rarity: Rarity,
    private icon: string,
    private condition: Condition,
    private readonly createdAt: Date = new Date()
  ) { }

  static create(data: Omit<AchievementsPrimitives, 'id' | 'createdAt'>): Achievement {
    const rarity = typeof data.rarity === 'string'
      ? new Rarity(data.rarity as RarityType)
      : data.rarity;

    const condition = typeof data.condition === 'string'
      ? new Condition(data.condition as ConditionType)
      : data.condition;

    const achievement = new Achievement(
      uid(),
      data.title,
      data.description,
      data.points,
      rarity,
      data.icon,
      condition
    );

    achievement.validatePointsForRarity(data.points, rarity.value);
    return achievement;
  }

  static fromPrimitives(data: AchievementsPrimitives): Achievement {
    const rarity = typeof data.rarity === 'string'
      ? new Rarity(data.rarity as RarityType)
      : data.rarity;

    const condition = typeof data.condition === 'string'
      ? new Condition(data.condition as ConditionType)
      : data.condition;

    return new Achievement(
      data.id,
      data.title,
      data.description,
      data.points,
      rarity,
      data.icon,
      condition,
      new Date(data.createdAt)
    );
  }

  public update(data: Partial<Omit<AchievementsPrimitives, 'id' | 'createdAt'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.points !== undefined) this.points = data.points;

    if (data.rarity !== undefined) {
      this.rarity = typeof data.rarity === 'string'
        ? new Rarity(data.rarity as RarityType)
        : data.rarity;
    }

    if (data.icon !== undefined) this.icon = data.icon;

    if (data.condition !== undefined) {
      this.condition = typeof data.condition === 'string'
        ? new Condition(data.condition as ConditionType)
        : data.condition;
    }

    // Validate points for rarity after all updates
    if (data.points !== undefined || data.rarity !== undefined) {
      this.validatePointsForRarity(this.points, this.rarity.value);
    }
  }

  public toPrimitives(): AchievementsPrimitives {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      points: this.points,
      rarity: this.rarity.value,
      icon: this.icon,
      condition: this.condition.value,
      createdAt: this.createdAt.toISOString()
    };
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

export type AchievementsPrimitives = {
  id: string;
  title: string;
  description: string;
  points: number;
  rarity: RarityType | Rarity;
  icon: string;
  condition: ConditionType | Condition;
  createdAt: string;
};