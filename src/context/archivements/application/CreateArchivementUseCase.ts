import { Archivement } from "../domain/Archivement";
import { ArchivementRepository } from "../domain/ArchivementRepository";
import { CreateArchivementRequest } from "./requests/CreateArchivementRequests";

export class CreateArchivementUseCase {
  constructor(private readonly archivementRepository: ArchivementRepository) {}

  async execute(request: CreateArchivementRequest): Promise<Archivement> {
    const archivement = Archivement.create({
      title: request.title,
      description: request.description,
      points: request.points,
      rarity: request.rarity,
      icon: request.icon,
      condition: request.condition
    });

    await this.archivementRepository.create(archivement);

    return archivement;
  }
}  