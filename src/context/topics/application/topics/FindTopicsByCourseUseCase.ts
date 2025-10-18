import { TopicRepository } from '../../domain/TopicRepository';
import { Topic } from '../../domain/Topic';

export class FindTopicsByCourseUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(courseId: string): Promise<Topic[]> {
    if (!courseId || courseId.trim().length === 0) {
      throw new Error('ID del curso es requerido');
    }

    const topics = await this.topicRepository.findByCourseId(courseId);

    // Los topics ya están ordenados por el campo 'order' en el repositorio
    return topics;
  }
}
