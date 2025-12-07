import { LessonRepository } from '../domain/LessonRepository';
import { Lesson } from '../domain/Lesson';

export class FindLessonsByCourseIdUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(courseId: string): Promise<Lesson[]> {
    return this.lessonRepository.findByCourseId(courseId);
  }
}
