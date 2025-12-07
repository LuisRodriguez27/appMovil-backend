import { LessonRepository } from './../domain/LessonRepository';
import { TopicRepository } from '../../topics/domain/TopicRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';

export class DeleteLessonUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly topicRepository: TopicRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(lessonId: string): Promise<void> {
    if (!lessonId || lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // Obtener el topicId de la lección antes de eliminarla
    const topicId = lesson.toPrimitives().topicId;

    await this.lessonRepository.delete(lessonId);

    // Decrementar el contador de lecciones del curso
    if (topicId) {
      const topic = await this.topicRepository.findById(topicId);
      if (topic) {
        const courseId = topic.getCourseId();
        const course = await this.courseRepository.findById(courseId);
        if (course) {
          course.decrementTotalLessons();
          await this.courseRepository.update(course);
        }
      }
    }
  }
}
