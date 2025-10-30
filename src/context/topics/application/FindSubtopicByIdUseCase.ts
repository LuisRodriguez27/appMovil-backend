import { TopicRepository } from "../domain/TopicRepository";
import { Subtopic } from "../domain/Topic";

export class FindSubtopicByIdUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(topicId: string, subtopicId: string): Promise<Subtopic> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    // Buscar el subtopic
    const subtopic = topic.getSubtopic(subtopicId);
    if (!subtopic) {
      throw new Error('Subtema no encontrado');
    }

    return subtopic;
  }
}
