import { TopicRepository } from "../domain/TopicRepository";
import { DeleteSubtopicRequest } from "./requests/DeleteSubtopicRequest";

export class DeleteSubtopicUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: DeleteSubtopicRequest): Promise<void> {
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

    // Eliminar el subtopic
    topic.deleteSubtopic(request.subtopicId);

    // Persistir
    await this.topicRepository.update(topic);
  }
}
