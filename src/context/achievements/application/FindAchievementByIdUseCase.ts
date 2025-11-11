import { AchievementsPrimitives } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";

export class FindAchievementByIdUseCase {
  constructor(private achievementRepository: AchievementRepository) {}

  async execute(id: string): Promise<AchievementsPrimitives> {
    const achievement = await this.achievementRepository.findById(id);

    if (!achievement) {
      throw new Error(`Achievement con el id ${id} no encontrado.`);
    }
    return achievement.toPrimitives();
  }
}  