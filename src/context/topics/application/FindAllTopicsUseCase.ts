import { TopicRepository } from "../domain/TopicRepository";
import { Topic } from "../domain/Topic";

export class FindAllTopicsUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(): Promise<Topic[]> {
    const topics = await this.topicRepository.findAll();
    return topics;
  }
}
