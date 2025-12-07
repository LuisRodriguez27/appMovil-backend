import { Course } from "../domain/Course";
import { CourseRepository } from "../domain/CourseRepository";

export class FindAllCoursesUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(): Promise<Course[]> {
    return await this.courseRepository.findAll();
  }
}