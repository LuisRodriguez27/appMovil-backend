import { Course } from "../domain/Course";
import { CourseRepository } from "../domain/CourseRepository";
import { CreateCourseRequest } from "./request/CreateCourseRequest";

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}
  
  async execute(request: CreateCourseRequest): Promise<Course> {
    // Verificar que el nombre del curso no esté registrado
    const existingCourseByName = await this.courseRepository.findByName(request.title);
    if (existingCourseByName) {
      throw new Error("El curso ya está registrado");
    }

    const course = Course.create({
      title: request.title,
      description: request.description
    });

    await this.courseRepository.create(course);

    return course;
  }
}