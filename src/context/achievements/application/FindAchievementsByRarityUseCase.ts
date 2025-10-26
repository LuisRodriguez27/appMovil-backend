import { Achievement } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";

export class FindAchievementsByRarityUseCase {
  constructor(private readonly achievementRepository: AchievementRepository) {}

  async execute(rarity: string): Promise<Achievement[]> {
    const validRarities = ['comun', 'especial', 'epico', 'legendario'];
    
    if (!validRarities.includes(rarity)) {
      throw new Error(
        `Rareza inválida. Debe ser: ${validRarities.join(', ')}`
      );
    }

    return await this.achievementRepository.findByRarity(rarity);
  }
}