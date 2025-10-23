import { AchievementsPrimitives } from "../domain/Achievement";
import { ArchivementRepository } from "../domain/AchievementRepository";

export class FindArchivementByIdUseCase {
  constructor(private archivementRepository: ArchivementRepository) {}

  async execute(id: string): Promise<AchievementsPrimitives> {
    const archivement = await this.archivementRepository.findById(id);

    if (!archivement) {
      throw new Error(`Archivement con el ${id} no encontrado.`);
    }
    return archivement.toPrimitives();
  }
}  