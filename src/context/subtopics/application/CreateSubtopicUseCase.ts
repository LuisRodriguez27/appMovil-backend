import { TopicRepository } from "../../topics/domain/TopicRepository";
import { Subtopic } from "../domain/Subtopic";
import { SubtopicRepository } from "../domain/SubtopicRepository";
import { CreateSubtopicRequest } from "./requests/CreateSubtopicRequest";

export class CreateSubtopicUseCase {
	constructor(
		private readonly subtopicRepository: SubtopicRepository,
		private readonly topicRepository: TopicRepository
	) {}

	async execute(request: CreateSubtopicRequest): Promise<Subtopic> {

		const topic = await this.topicRepository.findById(request.topicId);
		if (!topic) {
			throw new Error('El tema especificado no existe');
		}

		const subtopicInTopic = await this.subtopicRepository.findByTopicId(request.topicId);
		const existingSubtopicByTitle = subtopicInTopic.find(
			subtopic => subtopic.getTitle().toLowerCase() === request.title.trim().toLowerCase()
		);

		if (existingSubtopicByTitle) {
			throw new Error('Ya existe un subtema con este título en el tema');
		}

		const subtopic = Subtopic.create({
			topicId: request.topicId,
			title: request.title.trim(),
			order: request.order,
			description: request.description?.trim(),
		});

		await this.subtopicRepository.create(subtopic);

		return subtopic;
	}
}		