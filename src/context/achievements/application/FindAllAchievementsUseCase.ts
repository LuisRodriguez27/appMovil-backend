import { AchievementsPrimitives } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";

export class FindAllAchievementUseCase {
  constructor(private readonly achievementRepository: AchievementRepository) {}

  async execute(): Promise<AchievementsPrimitives[]> {
    const achievements = await this.achievementRepository.findAll();
    return achievements.map(achievement => achievement.toPrimitives());
  }
}