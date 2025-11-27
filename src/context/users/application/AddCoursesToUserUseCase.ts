import { UserRepository } from '../domain/UserRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { Progress } from '../domain/value-objects/Progress';
import { CourseProgress } from '../domain/value-objects/CourseProgress';

export interface AddCoursesToUserRequest {
  userId: string;
  courseIds: string[];
}

export interface AddCoursesToUserResponse {
  message: string;
  addedCourses: string[];
}

/**
 * Caso de uso para agregar cursos a un usuario
 *
 * Este caso de uso:
 * 1. Valida que el usuario exista
 * 2. Valida que los cursos existan
 * 3. Inicializa el progreso para cada curso nuevo
 * 4. Si el usuario no tiene currentCourseId, establece el primero como actual
 */
export class AddCoursesToUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(request: AddCoursesToUserRequest): Promise<AddCoursesToUserResponse> {
    // 1. Buscar el usuario
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Validar que todos los cursos existan
    const validatedCourses: string[] = [];

    for (const courseId of request.courseIds) {
      const course = await this.courseRepository.findById(courseId);

      if (!course) {
        throw new Error(`El curso con ID ${courseId} no existe`);
      }

      validatedCourses.push(courseId);
    }

    // 3. Obtener el progreso actual del usuario
    let userProgress = user.getProgress();

    if (!userProgress) {
      // Si el usuario no tiene progreso, crear uno nuevo
      userProgress = Progress.create({});
    }

    // 4. Agregar los cursos nuevos al progreso
    const addedCourses: string[] = [];

    for (const courseId of validatedCourses) {
      // Solo agregar si el usuario no está ya inscrito
      const existingProgress = userProgress.getCourseProgress(courseId);

      if (!existingProgress) {
        const newCourseProgress = CourseProgress.create({
          lastLessonCompletedId: '',
          nextLessonId: '',
          completedCount: 0,
          percentage: 0,
        });

        userProgress = userProgress.updateCourseProgress(courseId, newCourseProgress);
        addedCourses.push(courseId);
      }
    }

    // 5. Actualizar el usuario con el nuevo progress
    user.setProgress(userProgress);

    // 6. Si el usuario no tiene currentCourseId, establecer el primero
    if (!user.getCurrentCourseId() && addedCourses.length > 0) {
      user.update({
        currentCourseId: addedCourses[0],
      });
    }

    // 7. Guardar los cambios
    await this.userRepository.update(user);

    return {
      message: `${addedCourses.length} curso(s) agregado(s) exitosamente`,
      addedCourses,
    };
  }
}
