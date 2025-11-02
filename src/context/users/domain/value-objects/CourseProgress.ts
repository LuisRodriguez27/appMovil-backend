/**
 * Value Object: CourseProgress
 * Representa el progreso de un usuario en un curso específico
 */
export class CourseProgress {
  private constructor(
    public readonly lessonsCompleted: Map<string, boolean>,
    public readonly completedCount: number,
    public readonly percentage: number,
    public readonly lastViewedLesson: string | null
  ) {}

  /**
   * Crea una nueva instancia de CourseProgress
   */
  static create(data?: {
    lessonsCompleted?: Record<string, boolean>;
    completedCount?: number;
    percentage?: number;
    lastViewedLesson?: string | null;
  }): CourseProgress {
    const lessonsMap = new Map(
      Object.entries(data?.lessonsCompleted || {})
    );

    return new CourseProgress(
      lessonsMap,
      data?.completedCount || 0,
      data?.percentage || 0,
      data?.lastViewedLesson || null
    );
  }

  /**
   * Marca una lección como completada
   */
  markLessonCompleted(lessonId: string, totalLessons: number): CourseProgress {
    // Si ya está completada, no hacer nada
    if (this.lessonsCompleted.has(lessonId)) {
      return this;
    }

    const newLessons = new Map(this.lessonsCompleted);
    newLessons.set(lessonId, true);

    const newCompletedCount = this.completedCount + 1;
    const newPercentage = totalLessons > 0 
      ? Math.round((newCompletedCount / totalLessons) * 100)
      : 0;

    return new CourseProgress(
      newLessons,
      newCompletedCount,
      newPercentage,
      lessonId
    );
  }

  /**
   * Verifica si una lección está completada
   */
  isLessonCompleted(lessonId: string): boolean {
    return this.lessonsCompleted.has(lessonId);
  }

  /**
   * Actualiza la última lección vista (sin marcarla como completada)
   */
  updateLastViewedLesson(lessonId: string): CourseProgress {
    return new CourseProgress(
      this.lessonsCompleted,
      this.completedCount,
      this.percentage,
      lessonId
    );
  }

  /**
   * Recalcula el porcentaje basado en el total de lecciones
   */
  recalculatePercentage(totalLessons: number): CourseProgress {
    const newPercentage = totalLessons > 0
      ? Math.round((this.completedCount / totalLessons) * 100)
      : 0;

    return new CourseProgress(
      this.lessonsCompleted,
      this.completedCount,
      newPercentage,
      this.lastViewedLesson
    );
  }

  /**
   * Convierte el value object a primitivos para persistencia
   */
  toPrimitives(): CourseProgressPrimitives {
    return {
      lessons_completed: Object.fromEntries(this.lessonsCompleted),
      completed_count: this.completedCount,
      percentage: this.percentage,
      last_viewed_lesson: this.lastViewedLesson
    };
  }
}

export type CourseProgressPrimitives = {
  lessons_completed: Record<string, boolean>;
  completed_count: number;
  percentage: number;
  last_viewed_lesson: string | null;
};
