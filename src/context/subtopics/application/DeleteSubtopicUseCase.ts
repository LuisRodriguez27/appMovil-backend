import { SubtopicRepository } from "../domain/SubtopicRepository";

export class DeleteSubtopicUseCase {
	constructor (private readonly subtopicRepository: SubtopicRepository) {}

	async execute(id: string): Promise<void> {
		const subtopic = await this.subtopicRepository.findById(id);

		if (!subtopic) {
			throw new Error(`Subtopic con el ${id} no encontrado.`);
		}

		await this.subtopicRepository.delete(id);
	}
}