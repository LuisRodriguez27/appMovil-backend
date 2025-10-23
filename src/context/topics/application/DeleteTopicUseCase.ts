import { TopicRepository } from "../domain/TopicRepository";
import { DeleteTopicRequest } from "./requests/DeleteTopicRequest";

export class DeleteTopicUseCase {
  constructor(private readonly topicRepository: TopicRepository) {}

  async execute(request: DeleteTopicRequest): Promise<void> {
    // Verificar que el topic existe
    const topic = await this.topicRepository.findById(request.id);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    // NOTA: Si en el futuro tenemos Lessons, aquí deberíamos eliminarlas primero (cascada)
    // await this.lessonRepository.deleteAllByTopicId(request.id);

    // Eliminar el topic
    await this.topicRepository.delete(request.id);
  }
}
