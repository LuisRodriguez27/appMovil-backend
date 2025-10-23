import { AchievementsPrimitives } from "../domain/Achievement";
import { ArchivementRepository } from "../domain/AchievementRepository";

export class FindAllArchivementUseCase {
  constructor(private readonly archivementRepository: ArchivementRepository) {}

  async execute(): Promise<AchievementsPrimitives[]> {
    const achievements = await this.archivementRepository.findAll();
    return achievements.map(archivement => archivement.toPrimitives());
  }
}