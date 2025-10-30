import { TopicRepository } from "../domain/TopicRepository";
import { Subtopic } from "../domain/Topic";
import { AddSubtopicRequest } from "./requests/AddSubtopicRequest";

export class AddSubtopicUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: AddSubtopicRequest): Promise<Subtopic> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(request.topicId);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    // Añadir el subtopic
    const newSubtopic = topic.addSubtopic({
      title: request.title.trim(),
      description: request.description.trim(),
      order: request.order
    });

    // Persistir
    await this.topicRepository.update(topic);

    return newSubtopic;
  }
}
