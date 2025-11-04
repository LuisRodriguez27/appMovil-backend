import { Subtopic } from "../domain/Subtopic";
import { SubtopicRepository } from "../domain/SubtopicRepository";
import { UpdateSubtopicRequest } from "./requests/UpdateSubtopicRequests";

export class UpdateSubtopicUseCase {
	constructor(
		private readonly subtopicRepository: SubtopicRepository
	) {}

	async execute(request: UpdateSubtopicRequest): Promise<Subtopic> {
		const subtopic = await this.subtopicRepository.findById(request.id);
		if (!subtopic) {
			throw new Error('Subtema no encontrado');
		}

		if (request.title !== undefined) {
			const subtopicsInTopic = await this.subtopicRepository.findByTopicId(subtopic.getTopicId());
			const existingSubtopicByTitle = subtopicsInTopic.find(
				st => st.getId() !== request.id &&
					st.getTitle().toLowerCase() === request.title!.trim().toLowerCase()
			);

			if (existingSubtopicByTitle) {
				throw new Error('Ya existe un subtema con este título en el tema');
			}
		}

		subtopic.update({
			title: request.title?.trim(),
			order: request.order,
			description: request.description?.trim(),
		});

		await this.subtopicRepository.update(subtopic);

		return subtopic;
	}
}
