import { UserRepository } from '../../users/domain/UserRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { CompleteOnboardingRequest } from './requests/CompleteOnboardingRequest';

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
    // El progreso se inicializa automáticamente cuando el usuario comienza una lección
    // Por ahora solo guardamos el usuario con su currentCourseId actualizado

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
