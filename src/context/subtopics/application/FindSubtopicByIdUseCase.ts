import { Subtopic } from "../domain/Subtopic";
import { SubtopicRepository } from "../domain/SubtopicRepository";

export class FindSubtopicByIdUseCase {
	constructor(private readonly subtopicRepository: SubtopicRepository) {}

	async execute(id: string): Promise<Subtopic | null> {
		if (!id || id.trim().length === 0) {
			throw new Error('ID del subtema es requerido');
		}

		const subtopic = await this.subtopicRepository.findById(id);

		if (!subtopic) {
			throw new Error('Subtema no encontrado');
		}

		return subtopic;
	}
}