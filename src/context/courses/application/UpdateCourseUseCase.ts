import { CourseRepository } from "../domain/CourseRepository";
import { Course } from "../domain/Course";
import { UpdateCourseRequest } from "./requests/UpdateCourseRequest";

export class UpdateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(request: UpdateCourseRequest): Promise<Course> {
    // Verificar que el curso existe
    const course = await this.courseRepository.findById(request.id);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // Si se actualiza el título, verificar que no exista otro curso con ese título
    if (request.title) {
      const existingCourseByTitle = await this.courseRepository.findByTitle(request.title);
      // Verificar que no sea el mismo curso y que el título sea diferente
      if (existingCourseByTitle && existingCourseByTitle.getId() !== request.id) {
        throw new Error('Ya existe otro curso con este título');
      }
    }

    // Actualizar el curso
    course.update({
      title: request.title,
      description: request.description,
    });

    await this.courseRepository.update(course);

    return course;
  }
}
