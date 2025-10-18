import { TopicRepository } from '../domain/TopicRepository';
import { Topic } from '../domain/Topic';

export class FindTopicByIdUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(topicId: string): Promise<Topic> {
    if (!topicId || topicId.trim().length === 0) {
      throw new Error('ID del tema es requerido');
    }

    const topic = await this.topicRepository.findById(topicId);

    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    return topic;
  }
}
