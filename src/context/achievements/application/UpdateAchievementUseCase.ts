import { Achievement } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";
import { UpdateAchievementRequest } from "./requests/UpdateAchievementRequest";

export class UpdateAchievementUseCase {
  constructor (private readonly achievementRepository: AchievementRepository) {}

  async execute(achievementId: string, request: UpdateAchievementRequest): Promise<Achievement> {
    // Validar que el achievementId no esté vacío
    if (!achievementId || achievementId.trim().length === 0) {
      throw new Error('ID de logro es requerido');
    }

    const achievement = await this.achievementRepository.findById(achievementId);
    if (!achievement) {
      throw new Error('Logro no encontrado');
    }

    achievement.update({
      title: request.title,
      description: request.description,
      points: request.points,
      rarity: request.rarity,
      icon: request.icon,
      condition: request.condition
    });

    await this.achievementRepository.update(achievement);

    return achievement;
  }
}