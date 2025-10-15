import { Course } from "../domain/Course";
import { CourseRepository } from "../domain/CourseRepository";
import { UpdateCourseRequest } from "./request/UpdateCourseRequest";

export class UpdateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string, request: UpdateCourseRequest): Promise<Course> {
    if (!id || id.trim().length === 0) {
      throw new Error("ID del curso es requerido");
    }

    const course = await this.courseRepository.findById(id);

    if (!course) {
      throw new Error("Curso no encontrado");
    }

    // Verificar que el nombre del curso no esté en uso por otro curso
    if (request.title && request.title !== course.getTitle()) {
      const existingCourse = await this.courseRepository.findByName(request.title);
      if (existingCourse && existingCourse.getId() !== id) {
        throw new Error("El nombre del curso ya está en uso por otro curso");
      }
    }

    // Actualizar curso
    course.update({
      title: request.title,
      description: request.description,
    });

    await this.courseRepository.update(course);

    return course;
  }
}6