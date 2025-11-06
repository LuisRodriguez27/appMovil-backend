import { SubtopicRepository } from "../domain/SubtopicRepository";
import { LessonRepository } from "../../lessons/domain/LessonRepository";

export class DeleteSubtopicUseCase {
	constructor (
		private readonly subtopicRepository: SubtopicRepository,
		private readonly lessonRepository: LessonRepository
	) {}

	async execute(id: string): Promise<void> {
		const subtopic = await this.subtopicRepository.findById(id);

		if (!subtopic) {
			throw new Error(`Subtopic con el ${id} no encontrado.`);
		}

		await this.lessonRepository.deleteBySubtopicId(id);

		await this.subtopicRepository.delete(id);
	}
}