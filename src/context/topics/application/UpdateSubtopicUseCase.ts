import { TopicRepository } from "../domain/TopicRepository";
import { Subtopic } from "../domain/Topic";
import { UpdateSubtopicRequest } from "./requests/UpdateSubtopicRequest";

export class UpdateSubtopicUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: UpdateSubtopicRequest): Promise<Subtopic> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(request.topicId);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    // Verificar que el subtopic existe
    const subtopic = topic.getSubtopic(request.subtopicId);
    if (!subtopic) {
      throw new Error('Subtema no encontrado');
    }

    // Actualizar el subtopic
    topic.updateSubtopic(request.subtopicId, {
      title: request.title?.trim(),
      description: request.description?.trim(),
      order: request.order
    });

    // Persistir
    await this.topicRepository.update(topic);

    // Obtener el subtopic actualizado
    const updatedSubtopic = topic.getSubtopic(request.subtopicId);
    if (!updatedSubtopic) {
      throw new Error('Error al actualizar el subtema');
    }

    return updatedSubtopic;
  }
}
