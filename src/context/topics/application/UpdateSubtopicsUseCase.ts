import { TopicRepository } from "../domain/TopicRepository";
import { Subtopic } from "../domain/Topic";
import { UpdateSubtopicsRequest } from "./requests/UpdateSubtopicsRequest";

export class UpdateSubtopicsUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: UpdateSubtopicsRequest): Promise<Subtopic | Subtopic[]> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(request.topicId);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    const updatedSubtopics: Subtopic[] = [];
    const updates = request.asArray();

    // Actualizar cada subtopic
    for (const update of updates) {
      // Verificar que el subtopic existe
      const subtopic = topic.getSubtopic(update.subtopicId);
      if (!subtopic) {
        throw new Error(`Subtema no encontrado: ${update.subtopicId}`);
      }

      // Actualizar el subtopic
      topic.updateSubtopic(update.subtopicId, {
        title: update.title?.trim(),
        description: update.description?.trim(),
        order: update.order
      });

      // Obtener el subtopic actualizado
      const updated = topic.getSubtopic(update.subtopicId);
      if (updated) {
        updatedSubtopics.push(updated);
      }
    }

    // Persistir una sola vez
    await this.topicRepository.update(topic);

    // Retornar un solo item o array dependiendo de la entrada
    return request.isSingle() ? updatedSubtopics[0] : updatedSubtopics;
  }
}
