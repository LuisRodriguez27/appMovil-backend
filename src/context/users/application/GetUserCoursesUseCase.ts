import { UserRepository } from '../domain/UserRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';

export interface UserCourseInfo {
  id: string;
  title: string;
  description?: string;
  totalTopics: number;
  totalLessons: number;
  progress: {
    completedCount: number;
    percentage: number;
    lastLessonCompletedId: string;
    nextLessonId: string;
  };
}

export interface GetUserCoursesResponse {
  enrolledCourses: UserCourseInfo[];
  availableCourses: {
    id: string;
    title: string;
    description?: string;
    totalTopics: number;
    totalLessons: number;
  }[];
}

/**
 * Caso de uso para obtener los cursos de un usuario
 *
 * Retorna:
 * - enrolledCourses: Cursos en los que el usuario está inscrito (con progreso)
 * - availableCourses: Cursos disponibles que el usuario puede agregar
 */
export class GetUserCoursesUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(userId: string): Promise<GetUserCoursesResponse> {
    // 1. Obtener el usuario
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 2. Obtener todos los cursos disponibles
    const allCourses = await this.courseRepository.findAll();

    // 3. Obtener el progreso del usuario
    const userProgress = user.getProgress();
    const enrolledCourseIds = userProgress
      ? Array.from(userProgress.courses.keys())
      : [];

    // 4. Separar cursos inscritos de cursos disponibles
    const enrolledCourses: UserCourseInfo[] = [];
    const availableCourses: GetUserCoursesResponse['availableCourses'] = [];

    for (const course of allCourses) {
      const courseId = course.getId();
      const isEnrolled = enrolledCourseIds.includes(courseId);

      if (isEnrolled) {
        const courseProgress = userProgress!.getCourseProgress(courseId);

        enrolledCourses.push({
          id: courseId,
          title: course.getTitle(),
          description: course.getDescription(),
          totalTopics: course.getTotalTopics(),
          totalLessons: course.getTotalLessons(),
          progress: {
            completedCount: courseProgress?.completedCount || 0,
            percentage: courseProgress?.percentage || 0,
            lastLessonCompletedId: courseProgress?.lastLessonCompletedId || '',
            nextLessonId: courseProgress?.nextLessonId || '',
          },
        });
      } else {
        availableCourses.push({
          id: courseId,
          title: course.getTitle(),
          description: course.getDescription(),
          totalTopics: course.getTotalTopics(),
          totalLessons: course.getTotalLessons(),
        });
      }
    }

    return {
      enrolledCourses,
      availableCourses,
    };
  }
}
