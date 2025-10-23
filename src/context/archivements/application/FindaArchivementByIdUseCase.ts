import { Archivement } from "../domain/Archivement";
import { ArchivementRepository } from "../domain/ArchivementRepository";

export class FindAllArchivementUseCase {
  constructor(private archivementRepository: ArchivementRepository) {}

  async execute(): Promise<Archivement[]> {
    return await this.archivementRepository.findAll();
  }
}  