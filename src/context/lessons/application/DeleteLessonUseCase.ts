import { LessonRepository } from './../domain/LessonRepository';

export class DeleteLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(lessonId: string): Promise<void> {
    // Validar que el lessonId no esté vacío
    if (!lessonId || lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    // Verificar que la lección existe antes de eliminar
    const exists = await this.lessonRepository.existsById(lessonId);
    if (!exists) {
      throw new Error('Lección no encontrada');
    }

    // Eliminar la lección
    await this.lessonRepository.delete(lessonId);
  }
}
