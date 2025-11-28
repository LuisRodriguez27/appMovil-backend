import { LessonRepository } from '../domain/LessonRepository';
import { TopicRepository } from '../../topics/domain/TopicRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { Lesson } from '../domain/Lesson';
import { CreateLessonRequest } from './requests/CreateLessonRequest';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';

export class CreateLessonUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly subtopicRepository: SubtopicRepository,
    private readonly topicRepository: TopicRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(request: CreateLessonRequest): Promise<Lesson> {
    const subtopic = await this.subtopicRepository.findById(request.subtopicId);
    if (!subtopic) {
      throw new Error('El subtema especificado no existe');
    }

    const topic = await this.topicRepository.findById(subtopic.getTopicId());
    if (!topic) {
      throw new Error('El tema asociado al subtema no existe');
    }

    const course = await this.courseRepository.findById(topic.getCourseId());
    if (!course) {
      throw new Error('El curso asociado al tema no existe');
    }

    const lesson = Lesson.create({
      topicId: request.topicId,
      subtopicId: request.subtopicId,
      title: request.title,
      content: request.content,
      order: request.order,
      exerciseConfig: request.exerciseConfig,
      description: request.description,
    });

    await this.lessonRepository.create(lesson);

    await this.courseRepository.updateCounters(course.getId(), undefined, course.getTotalLessons() + 1);

    return lesson;
  }
}
