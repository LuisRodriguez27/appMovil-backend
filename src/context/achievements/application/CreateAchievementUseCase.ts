import { Achievement } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";
import { CreateAchievementRequest } from "./requests/CreateAchievementRequests";

export class CreateAchievementUseCase {
  constructor(private readonly achievementRepository: AchievementRepository) {}

  async execute(request: CreateAchievementRequest): Promise<Achievement> {
    const achievement = Achievement.create({
      title: request.title,
      description: request.description,
      rarity: request.rarity,
      icon: request.icon,
      condition: request.condition
    });

    await this.achievementRepository.create(achievement);

    return achievement;
  }
}  