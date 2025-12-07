import { TopicRepository } from "../domain/TopicRepository";
import { DeleteTopicRequest } from "./requests/DeleteTopicRequest";
import { SubtopicRepository } from "../../subtopics/domain/SubtopicRepository";
import { LessonRepository } from "../../lessons/domain/LessonRepository";

export class DeleteTopicUseCase {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly subtopicRepository: SubtopicRepository,
    private readonly lessonRepository: LessonRepository
  ) {}

  async execute(request: DeleteTopicRequest): Promise<void> {
    const topic = await this.topicRepository.findById(request.id);
    if (!topic) {
      throw new Error('Tema no encontrado');
    }

    await this.lessonRepository.deleteByTopicId(request.id);

    await this.subtopicRepository.deleteByTopicId(request.id);

    await this.topicRepository.delete(request.id);
  }
}
