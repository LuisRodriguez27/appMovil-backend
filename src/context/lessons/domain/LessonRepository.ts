import { Lesson } from './Lesson';

export interface LessonRepository {
  create(lesson: Lesson): Promise<void>;

  update(lesson: Lesson): Promise<void>;

  findAll(): Promise<Lesson[]>;

  findById(id: string): Promise<Lesson | null>;
  
  findByTopicId(topicId: string): Promise<Lesson[]>;

  findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]>;

  findByCourseId(courseId: string): Promise<Lesson[]>;

  findFinalLessonByTopicId(topicId: string): Promise<Lesson | null>;

  delete(id: string): Promise<void>;

  deleteBySubtopicId(subtopicId: string): Promise<void>;
}
