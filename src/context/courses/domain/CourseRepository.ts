import { Course } from "./Course";

export interface CourseRepository {
  create(course: Course): Promise<void>;
  findById(id: string): Promise<Course | null>;
  findByTitle(title: string): Promise<Course | null>;
  findAll(): Promise<Course[]>;
  update(course: Course): Promise<void>;
  delete(id: string): Promise<void>;
  updateCounters(id: string, totalTopics?: number, totalLessons?: number): Promise<void>;
}