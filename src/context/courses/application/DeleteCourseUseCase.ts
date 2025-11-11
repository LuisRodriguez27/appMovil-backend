import { CourseRepository } from "../domain/CourseRepository";
import { DeleteCourseRequest } from "./requests/DeleteCourseRequest";
import { TopicRepository } from "../../topics/domain/TopicRepository";

export class DeleteCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly topicRepository: TopicRepository
  ) {}

  async execute(request: DeleteCourseRequest): Promise<void> {
    // Verificar que el curso existe
    const course = await this.courseRepository.findById(request.id);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // ELIMINACIÓN EN CASCADA:
    // 1. Eliminar todos los topics del curso
    await this.topicRepository.deleteAllByCourseId(request.id);

    // 2. Eliminar el curso
    await this.courseRepository.delete(request.id);

    // Nota: Si hubiera LessonRepository, también deberíamos eliminar las lecciones aquí
    // await this.lessonRepository.deleteAllByCourseId(request.id);

    // Nota: Si fuera necesario, actualizar usuarios que tengan este curso como currentCourse
    // await this.userRepository.updateCurrentCourseByValue(request.id, null);
  }
}
