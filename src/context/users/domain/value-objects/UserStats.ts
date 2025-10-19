/**
 * Value Object: UserStats
 * Representa las estadísticas generales del usuario
 */
export class UserStats {
  private constructor(
    public readonly totalLessonsCompleted: number,
    public readonly totalExercisesCompleted: number,
    public readonly totalCoursesCompleted: number
  ) {}

  /**
   * Crea una nueva instancia de UserStats con valores por defecto
   */
  static create(data?: {
    totalLessonsCompleted?: number;
    totalExercisesCompleted?: number;
    totalCoursesCompleted?: number;
    averageScore?: number;
    studyTimeMinutes?: number;
  }): UserStats {
    return new UserStats(
      data?.totalLessonsCompleted || 0,
      data?.totalExercisesCompleted || 0,
      data?.totalCoursesCompleted || 0
    );
  }

  /**
   * Crea UserStats desde datos de persistencia
   */
  static fromPrimitives(data: {
    total_lessons_completed: number;
    total_exercises_completed: number;
    total_courses_completed: number;
  }): UserStats {
    return new UserStats(
      data.total_lessons_completed,
      data.total_exercises_completed,
      data.total_courses_completed
    );
  }

  /**
   * Incrementa el contador de lecciones completadas
   */
  incrementLessonsCompleted(count: number = 1): UserStats {
    return new UserStats(
      this.totalLessonsCompleted + count,
      this.totalExercisesCompleted,
      this.totalCoursesCompleted
    );
  }

  /**
   * Incrementa el contador de ejercicios completados y actualiza el promedio
   */
  incrementExercisesCompleted(score: number): UserStats {
    const newTotal = this.totalExercisesCompleted + 1;

    return new UserStats(
      this.totalLessonsCompleted,
      newTotal,
      this.totalCoursesCompleted
    );
  }

  /**
   * Incrementa el contador de cursos completados
   */
  incrementCoursesCompleted(): UserStats {
    return new UserStats(
      this.totalLessonsCompleted,
      this.totalExercisesCompleted,
      this.totalCoursesCompleted + 1
    );
  }

  /**
   * Añade tiempo de estudio en minutos
   */
  addStudyTime(minutes: number): UserStats {
    if (minutes < 0) {
      throw new Error('El tiempo de estudio no puede ser negativo');
    }

    return new UserStats(
      this.totalLessonsCompleted,
      this.totalExercisesCompleted,
      this.totalCoursesCompleted
    );
  }

  /**
   * Verifica si el usuario es considerado activo
   * (al menos 1 lección o ejercicio completado)
   */
  isActive(): boolean {
    return this.totalLessonsCompleted > 0 || this.totalExercisesCompleted > 0;
  }

  /**
   * Obtiene estadísticas resumidas
   */
  getSummary(): {
    lessons: number;
    exercises: number;
    courses: number;
  } {
    return {
      lessons: this.totalLessonsCompleted,
      exercises: this.totalExercisesCompleted,
      courses: this.totalCoursesCompleted
    };
  }

  /**
   * Convierte el value object a primitivos para persistencia
   */
  toPrimitives(): UserStatsPrimitives {
    return {
      total_lessons_completed: this.totalLessonsCompleted,
      total_exercises_completed: this.totalExercisesCompleted,
      total_courses_completed: this.totalCoursesCompleted
    };
  }
}

export type UserStatsPrimitives = {
  total_lessons_completed: number;
  total_exercises_completed: number;
  total_courses_completed: number;
};
