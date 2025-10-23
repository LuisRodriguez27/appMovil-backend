import { ArchivementRepository } from "../domain/AchievementRepository";

export class DeleteArchivementUseCase {
	constructor (private readonly archivementRepository: ArchivementRepository) {}

	async execute(id: string): Promise<void> {
		const archivement = await this.archivementRepository.findById(id);

		if (!archivement) {
			throw new Error(`Archivement con el ${id} no encontrado.`);
		}

		await this.archivementRepository.delete(id);
	}
}