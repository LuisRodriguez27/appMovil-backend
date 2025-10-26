import { Achievement } from "./Achievement";

export interface AchievementRepository {
  create(achievement: Achievement): Promise<void>;
  findById(id: string): Promise<Achievement | null>;
  findAll(): Promise<Achievement[]>;
  update(achievement: Achievement): Promise<void>;
  delete(id: string): Promise<void>;
  findByRarity(rarity: string): Promise<Achievement[]>;
}