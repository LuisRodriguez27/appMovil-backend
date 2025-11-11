import { LessonRepository } from '../domain/LessonRepository';
import { Lesson } from '../domain/Lesson';
import { CreateLessonRequest } from './requests/CreateLessonRequest';

export class CreateLessonUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

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

    return lesson;
  }
}
