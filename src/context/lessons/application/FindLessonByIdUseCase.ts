import { LessonRepository } from '../domain/LessonRepository';
import { Lesson } from '../domain/Lesson';

export class FindLessonByIdUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(id: string): Promise<Lesson> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    const lesson = await this.lessonRepository.findById(id);

    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    return lesson;
  }
}
