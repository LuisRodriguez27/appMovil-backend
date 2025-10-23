import { uid } from "uid";

export class Archivement {
  constructor (
    public readonly id: string,
    private title: string,
    private description: string,
    private points: number,
    private rarity: string,
    private icon: string,
    private condition: { type: string; value: number | string } 
  ) {}

  static create (data: Omit<AchievementsPrimitives, 'id'>): Archivement {
    return new Archivement(
      uid(),
      data.title,
      data.description,
      data.points,
      data.rarity,
      data.icon,
      data.condition
    );
  }

  static fromPrimitives (data: AchievementsPrimitives): Archivement {
    return new Archivement(
      data.id,
      data.title,
      data.description,
      data.points,
      data.rarity,
      data.icon,
      data.condition
    );
  }

  public update (data: Partial<Omit<AchievementsPrimitives, 'id'>>): void {
    if (data.title !== undefined) this.title = data.title;
    if (data.description !== undefined) this.description = data.description;
    if (data.points !== undefined) this.points = data.points;
    if (data.rarity !== undefined) this.rarity = data.rarity;
    if (data.icon !== undefined) this.icon = data.icon;
    if (data.condition !== undefined) this.condition = data.condition;
  } 

  
  
  public toPrimitives (): AchievementsPrimitives {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      points: this.points,
      rarity: this.rarity,
      icon: this.icon,
      condition: this.condition
    };
  }
}  

export type AchievementsPrimitives = {
  id: string;
  title: string;
  description: string;
  points: number;
  rarity: string;
  icon: string;
  condition: { type: string; value: number | string };
};