import { TopicRepository } from "../domain/TopicRepository";
import { Subtopic } from "../domain/Topic";
import { AddSubtopicsRequest } from "./requests/AddSubtopicsRequest";

export class AddSubtopicsUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: AddSubtopicsRequest): Promise<Subtopic | Subtopic[]> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(request.topicId);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    // Añadir todos los subtopics
    const addedSubtopics: Subtopic[] = [];
    const subtopics = request.asArray();

    for (const subtopicData of subtopics) {
      const newSubtopic = topic.addSubtopic({
        title: subtopicData.title.trim(),
        description: subtopicData.description.trim(),
        order: subtopicData.order
      });
      addedSubtopics.push(newSubtopic);
    }

    // Persistir una sola vez
    await this.topicRepository.update(topic);

    // Retornar un solo item o array dependiendo de la entrada
    return request.isSingle() ? addedSubtopics[0] : addedSubtopics;
  }
}
