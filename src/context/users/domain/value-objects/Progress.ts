import { CourseProgress } from './CourseProgress';

/**
 * Value Object: Progress
 * Representa el progreso del usuario en todos sus cursos
 */
export class Progress {
  private constructor(
    public readonly courses: Map<string, CourseProgress>
  ) {}

  /**
   * Crea una nueva instancia de Progress
   */
  static create(data?: Record<string, any>): Progress {
    const coursesMap = new Map<string, CourseProgress>();

    if (data) {
      Object.entries(data).forEach(([courseId, courseData]) => {
        coursesMap.set(courseId, CourseProgress.create(courseData));
      });
    }

    return new Progress(coursesMap);
  }

  /**
   * Obtiene el progreso de un curso específico
   */
  getCourseProgress(courseId: string): CourseProgress | undefined {
    return this.courses.get(courseId);
  }

  /**
   * Actualiza el progreso de un curso
   */
  updateCourseProgress(courseId: string, courseProgress: CourseProgress): Progress {
    const newCourses = new Map(this.courses);
    newCourses.set(courseId, courseProgress);
    return new Progress(newCourses);
  }

  /**
   * Marca una lección como completada en un curso
   */
  completeLesson(courseId: string, lessonId: string, totalLessons: number): Progress {
    const currentProgress = this.courses.get(courseId) || CourseProgress.create();
    const updatedProgress = currentProgress.markLessonCompleted(lessonId, totalLessons);
    
    return this.updateCourseProgress(courseId, updatedProgress);
  }

  /**
   * Verifica si una lección está completada
   */
  isLessonCompleted(courseId: string, lessonId: string): boolean {
    const courseProgress = this.courses.get(courseId);
    return courseProgress ? courseProgress.isLessonCompleted(lessonId) : false;
  }

  /**
   * Actualiza la última lección vista de un curso
   */
  updateLastViewedLesson(courseId: string, lessonId: string): Progress {
    const currentProgress = this.courses.get(courseId) || CourseProgress.create();
    const updatedProgress = currentProgress.updateLastViewedLesson(lessonId);
    
    return this.updateCourseProgress(courseId, updatedProgress);
  }

  /**
   * Obtiene el total de lecciones completadas en todos los cursos
   */
  getTotalLessonsCompleted(): number {
    let total = 0;
    this.courses.forEach(courseProgress => {
      total += courseProgress.completedCount;
    });
    return total;
  }

  /**
   * Obtiene el porcentaje promedio de completitud de todos los cursos
   */
  getAverageCompletionPercentage(): number {
    if (this.courses.size === 0) return 0;
    
    let totalPercentage = 0;
    this.courses.forEach(courseProgress => {
      totalPercentage += courseProgress.percentage;
    });
    
    return Math.round(totalPercentage / this.courses.size);
  }

  /**
   * Convierte el value object a primitivos para persistencia
   */
  toPrimitives(): ProgressPrimitives {
    const result: Record<string, any> = {};
    
    this.courses.forEach((courseProgress, courseId) => {
      result[courseId] = courseProgress.toPrimitives();
    });
    
    return result;
  }
}

export type ProgressPrimitives = Record<string, any>;
