import { TopicRepository } from "../domain/TopicRepository";
import { Subtopic } from "../domain/Topic";
import { FindSubtopicsByTopicRequest } from "./requests/FindSubtopicsByTopicRequest";

export class FindSubtopicsByTopicUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: FindSubtopicsByTopicRequest): Promise<Subtopic[]> {
    const topic = await this.topicRepository.findById(request.topicId);

    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    return topic.getSubtopics();
  }
}
