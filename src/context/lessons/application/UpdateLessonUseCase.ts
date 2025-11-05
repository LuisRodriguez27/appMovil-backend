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

    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    lesson.update({
      title: request.title,
      content: request.content,
      exerciseConfig: request.exerciseConfig,
      description: request.description,
    });

    await this.lessonRepository.update(lesson);

    return lesson;
  }
}
