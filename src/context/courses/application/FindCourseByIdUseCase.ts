import { Course } from "../../domain/Course";
import { CourseRepository } from "../../domain/CourseRepository";

export class FindCourseByIdUseCase {
  constructor(private readonly courseRepository: CourseRepository) { }

  async execute(id: string): Promise<Course> {
    if (!id || id.trim().length === 0) {
      throw new Error("ID de curso es requerido");
    }

    const course = await this.courseRepository.findById(id);

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    return course;
  }
}