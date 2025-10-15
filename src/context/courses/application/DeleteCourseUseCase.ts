import { CourseRepository } from "../domain/CourseRepository";

export class DeleteCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de curso es requerido');
    }

    const course = await this.courseRepository.findById(id);

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    await this.courseRepository.delete(id);
  }
}