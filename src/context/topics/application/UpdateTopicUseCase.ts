import { TopicRepository } from "../domain/TopicRepository";
import { Topic } from "../domain/Topic";
import { UpdateTopicRequest } from "./requests/UpdateTopicRequest";

export class UpdateTopicUseCase {
  constructor(private readonly topicRepository: TopicRepository) { }

  async execute(request: UpdateTopicRequest): Promise<Topic> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(request.id);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    // Si se está actualizando el título, verificar que no exista otro con el mismo título
    // NOTA: Esta query requiere un índice compuesto en Firestore (course_id + order)
    // Si no existe, crear en: https://console.firebase.google.com/project/plataforma-estudio/firestore/indexes
    if (request.title !== undefined) {
      const topicsInCourse = await this.topicRepository.findByCourseId(topic.getCourseId());
      const existingTopicByTitle = topicsInCourse.find(
        t => t.getId() !== request.id &&
          t.getTitle().toLowerCase() === request.title!.trim().toLowerCase()
      );

      if (existingTopicByTitle) {
        throw new Error('Ya existe un tema con este título en el curso');
      }
    }

    topic.update({
      title: request.title?.trim(),
      order: request.order,
      description: request.description?.trim(),
    });

    await this.topicRepository.update(topic);

    return topic;
  }
}
