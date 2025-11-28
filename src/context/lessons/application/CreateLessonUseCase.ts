import { LessonRepository } from '../domain/LessonRepository';
import { TopicRepository } from '../../topics/domain/TopicRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { Lesson } from '../domain/Lesson';
import { CreateLessonRequest } from './requests/CreateLessonRequest';

export class CreateLessonUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly topicRepository: TopicRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(request: CreateLessonRequest): Promise<Lesson> {

    const lesson = Lesson.create({
      topicId: request.topicId,
      subtopicId: request.subtopicId,
      title: request.title,
      content: request.content,
      exerciseConfig: request.exerciseConfig,
      description: request.description,
    });

    await this.lessonRepository.create(lesson);

    // Incrementar el contador de lecciones del curso
    const topic = await this.topicRepository.findById(request.topicId);
    if (topic) {
      const courseId = topic.getCourseId();
      const course = await this.courseRepository.findById(courseId);
      if (course) {
        course.incrementTotalLessons();
        await this.courseRepository.update(course);
      }
    }

    return lesson;
  }
}
