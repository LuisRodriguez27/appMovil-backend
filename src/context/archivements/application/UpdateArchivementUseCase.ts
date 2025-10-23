import { Archivement } from "../domain/Archivement";
import { ArchivementRepository } from "../domain/ArchivementRepository";
import { UpdateArchivementRequest } from "./requests/UpdateArchivementRequest";

export class UpdateArchivementUseCase {
  constructor (private readonly ArchivementRepository: ArchivementRepository) {}

  async execute(archivementId: string, request: UpdateArchivementRequest): Promise<Archivement> {
    // Validar que el archivementId no esté vacío
    if (!archivementId || archivementId.trim().length === 0) {
      throw new Error('ID de logro es requerido');
    }

    const archivement = await this.ArchivementRepository.findById(archivementId);
    if (!archivement) {
      throw new Error('Logro no encontrado');
    }

    archivement.update({
      title: request.title,
      description: request.description,
      points: request.points,
      rarity: request.rarity,
      icon: request.icon
    });

    await this.ArchivementRepository.create(archivement);

    return archivement;
  }
}