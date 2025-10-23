import { Achievement } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";
import { UpdateAchievementRequest } from "./requests/UpdateAchievementRequest";

export class UpdateAchievementUseCase {
  constructor (private readonly AchievementRepository: AchievementRepository) {}

  async execute(archivementId: string, request: UpdateAchievementRequest): Promise<Achievement > {
    // Validar que el archivementId no esté vacío
    if (!archivementId || archivementId.trim().length === 0) {
      throw new Error('ID de logro es requerido');
    }

    const achievement = await this.AchievementRepository.findById(archivementId);
    if (!achievement) {
      throw new Error('Logro no encontrado');
    }

    achievement.update({
      title: request.title,
      description: request.description,
      points: request.points,
      rarity: request.rarity,
      icon: request.icon
    });

    await this.AchievementRepository.update(achievement);

    return achievement;
  }
}