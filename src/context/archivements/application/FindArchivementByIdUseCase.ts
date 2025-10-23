import { ArchivementsPrimitives } from "../domain/Archivement";
import { ArchivementRepository } from "../domain/ArchivementRepository";

export class FindArchivementByIdUseCase {
  constructor(private archivementRepository: ArchivementRepository) {}

  async execute(id: string): Promise<ArchivementsPrimitives> {
    const archivement = await this.archivementRepository.findById(id);

    if (!archivement) {
      throw new Error(`Archivement con el ${id} no encontrado.`);
    }
    return archivement.toPrimitives();
  }
}  