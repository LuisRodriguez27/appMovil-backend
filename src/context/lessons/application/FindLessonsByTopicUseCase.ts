import { LessonRepository } from './../domain/LessonRepository';
import { Lesson } from './../domain/Lesson';

export class FindLessonsByTopicUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(topicId: string): Promise<Lesson[]> {
    if (!topicId || topicId.trim().length === 0) {
      throw new Error('ID de tema es requerido');
    }

    const lessons = await this.lessonRepository.findByTopicId(topicId);

    return lessons;
  }
}
