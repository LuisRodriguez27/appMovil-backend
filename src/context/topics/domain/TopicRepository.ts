import { Topic } from './Topic';

export interface TopicRepository {
  create(topic: Topic): Promise<void>;
  findById(id: string): Promise<Topic | null>;
  findByCourseId(courseId: string): Promise<Topic[]>;
  findAll(): Promise<Topic[]>;
  update(topic: Topic): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAllByCourseId(courseId: string): Promise<void>; // Para eliminación en cascada
}
