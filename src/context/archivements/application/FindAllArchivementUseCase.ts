import { ArchivementsPrimitives } from "../domain/Archivement";
import { ArchivementRepository } from "../domain/ArchivementRepository";

export class FindAllArchivementUseCase {
  constructor(private readonly archivementRepository: ArchivementRepository) {}

  async execute(): Promise<ArchivementsPrimitives[]> {
    const archivements = await this.archivementRepository.findAll();
    return archivements.map(archivement => archivement.toPrimitives());
  }
}