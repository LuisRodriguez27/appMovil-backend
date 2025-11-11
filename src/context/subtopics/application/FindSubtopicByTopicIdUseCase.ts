import { Subtopic } from "../domain/Subtopic";
import { SubtopicRepository } from "../domain/SubtopicRepository";

export class FindSubtopicByTopicIdUseCase {
	constructor(private readonly subtopicRepository: SubtopicRepository) {}

	async execute(topicId: string): Promise<Subtopic[] | null> {

		if (!topicId || topicId.trim().length === 0) {
			throw new Error('ID del tema es requerido');
		}

		const topics = await this.subtopicRepository.findByTopicId(topicId);
		return topics;
	}
}