import { LessonRepository } from '../domain/LessonRepository';
import { Lesson } from '../domain/Lesson';
import { CreateLessonRequest } from './requests/CreateLessonRequest';

export class CreateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(request: CreateLessonRequest): Promise<Lesson> {
    // Crear la lección usando el factory method
    const lesson = Lesson.create({
      topicId: request.topicId,
      subtopicId: request.subtopicId,
      title: request.title,
      description: request.description,
      content: request.content,
      order: request.order,
      estimatedTime: request.estimatedTime,
      difficulty: request.difficulty,
      exercises: request.exercises
    });

    // Guardar en el repositorio
    await this.lessonRepository.save(lesson);

    return lesson;
  }
}
