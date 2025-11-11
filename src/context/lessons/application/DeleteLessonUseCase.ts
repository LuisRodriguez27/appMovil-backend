import { LessonRepository } from './../domain/LessonRepository';

export class DeleteLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(lessonId: string): Promise<void> {
    if (!lessonId || lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    const exists = await this.lessonRepository.findById(lessonId);
    if (!exists) {
      throw new Error('Lección no encontrada');
    }

    await this.lessonRepository.delete(lessonId);
  }
}
