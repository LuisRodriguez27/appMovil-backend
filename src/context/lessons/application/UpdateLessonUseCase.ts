import { LessonRepository } from '../domain/LessonRepository';
import { Lesson } from '../domain/Lesson';
import { UpdateLessonRequest } from './requests/UpdateLessonRequest';

export class UpdateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(lessonId: string, request: UpdateLessonRequest): Promise<Lesson> {
    // Validar que el lessonId no esté vacío
    if (!lessonId || lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    // Verificar que hay algo que actualizar
    if (!request.hasUpdates()) {
      throw new Error('No hay campos para actualizar');
    }

    // Buscar la lección
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // Actualizar los campos proporcionados
    lesson.update({
      title: request.title,
      description: request.description,
      content: request.content,
      order: request.order,
      estimated_time: request.estimatedTime,
      difficulty: request.difficulty,
      exercises: request.exercises
    });

    // Guardar cambios
    await this.lessonRepository.update(lesson);

    return lesson;
  }
}
