import { CourseRepository } from "../domain/CourseRepository";
import { Course } from "../domain/Course";
import { CreateCourseRequest } from "./requests/CreateCourseRequest";

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(request: CreateCourseRequest): Promise<Course> {
    // Verificar que el título no esté registrado
    const existingCourseByTitle = await this.courseRepository.findByTitle(request.title);
    if (existingCourseByTitle) {
      throw new Error('Ya existe un curso con este título');
    }

    // Crear el curso
    const course = Course.create({
      title: request.title,
      description: request.description,
    });

    await this.courseRepository.create(course);

    return course;
  }
}
