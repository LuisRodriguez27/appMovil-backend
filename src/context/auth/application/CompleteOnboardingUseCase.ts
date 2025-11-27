import { UserRepository } from '../../users/domain/UserRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { CompleteOnboardingRequest } from './requests/CompleteOnboardingRequest';
import { Progress } from '../../users/domain/value-objects/Progress';
import { CourseProgress } from '../../users/domain/value-objects/CourseProgress';

export interface CompleteOnboardingResponse {
  user: {
    __id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    currentCourseId?: string;
    profilePicture?: string;
    xp?: number;
    enrolledCourses: string[];
  };
  message: string;
}

/**
 * Caso de uso para completar el onboarding de un nuevo usuario
 *
 * Este caso de uso:
 * 1. Valida que el usuario exista
 * 2. Valida que los cursos seleccionados existan
 * 3. Actualiza el nombre del usuario
 * 4. Establece el curso principal (el primero seleccionado)
 * 5. Inicializa el progreso para cada curso seleccionado
 */
export class CompleteOnboardingUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(request: CompleteOnboardingRequest): Promise<CompleteOnboardingResponse> {
    // 1. Buscar el usuario
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Validar que todos los cursos existan
    const validatedCourses: string[] = [];

    for (const courseId of request.selectedCourseIds) {
      const course = await this.courseRepository.findById(courseId);

      if (!course) {
        throw new Error(`El curso con ID ${courseId} no existe`);
      }

      validatedCourses.push(courseId);
    }

    // 3. Actualizar el nombre del usuario
    user.update({
      name: request.name.trim(),
      currentCourseId: validatedCourses[0], // El primer curso es el actual
    });

    // 4. Inicializar el progreso para cada curso seleccionado
    let userProgress = user.getProgress();

    // Si el usuario no tiene progress, crear uno nuevo
    if (!userProgress) {
      userProgress = Progress.create({});
    }

    // Agregar cada curso seleccionado al progress con valores iniciales
    for (const courseId of validatedCourses) {
      // Solo agregar si el usuario no está ya inscrito en este curso
      const existingProgress = userProgress.getCourseProgress(courseId);

      if (!existingProgress) {
        const newCourseProgress = CourseProgress.create({
          lastLessonCompletedId: '',
          nextLessonId: '',
          completedCount: 0,
          percentage: 0,
        });

        userProgress = userProgress.updateCourseProgress(courseId, newCourseProgress);
      }
    }

    // Actualizar el usuario con el nuevo progress
    user.setProgress(userProgress);

    // 5. Guardar los cambios
    await this.userRepository.update(user);

    return {
      user: {
        __id: user.getId(),
        name: user.getName(),
        email: user.getEmail(),
        role: user.getRole(),
        currentCourseId: user.getCurrentCourseId(),
        profilePicture: user.getProfilePicture(),
        xp: user.getXP(),
        enrolledCourses: validatedCourses,
      },
      message: 'Onboarding completado exitosamente',
    };
  }
}
