import { Achievement } from "./Achievement";

export interface AchievementRepository {
  create(archivement: Achievement ): Promise<void>;
  findById(id: string): Promise<Achievement | null>;
  findAll(): Promise<Achievement []>;
  update(archivement: Achievement ): Promise<void>;
  delete(id: string): Promise<void>;
}