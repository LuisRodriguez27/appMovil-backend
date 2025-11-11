import { Subtopic } from "../domain/Subtopic";
import { SubtopicRepository } from "../domain/SubtopicRepository";

export class FindAllSubtopicsUseCase {
	constructor(private readonly subtopicRepository: SubtopicRepository) {}

	async execute(): Promise<Subtopic[]> {
		const subtopics = await this.subtopicRepository.findAll();
		return subtopics;
	}
}