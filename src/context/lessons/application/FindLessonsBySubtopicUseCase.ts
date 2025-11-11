import { LessonRepository } from '../domain/LessonRepository';
import { Lesson } from '../domain/Lesson';

export class FindLessonsBySubtopicUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(topicId: string, subtopicId: string): Promise<Lesson[]> {
    if (!topicId || topicId.trim().length === 0) {
      throw new Error('ID de tema es requerido');
    }

    if (!subtopicId || subtopicId.trim().length === 0) {
      throw new Error('ID de subtema es requerido');
    }

    const lessons = await this.lessonRepository.findBySubtopicId(topicId, subtopicId);

    return lessons;
  }
}
