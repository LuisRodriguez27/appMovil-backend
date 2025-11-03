import { Achievement } from "../domain/Achievement";
import { AchievementRepository } from "../domain/AchievementRepository";
import { Rarity } from "../domain/value-objects/Rarity";

export class FindAchievementsByRarityUseCase {
  constructor(private readonly achievementRepository: AchievementRepository) {}

  async execute(rarity: string): Promise<Achievement[]> {
    if (!Rarity.isValid(rarity)) {
      throw new Error(
        'Rareza inválida. Debe ser: common, special, epic o legendary'
      );
    }

    return await this.achievementRepository.findByRarity(rarity);
  }
}