export class CourseProgress {
  public readonly completedLessons: string[];
  public readonly completedCount: number;

  private constructor(
    public readonly nextLessonId: string,
    completedLessons: string[],
    public readonly percentage: number,
    public readonly completedAt?: Date
  ) {
    this.completedLessons = completedLessons;
    this.completedCount = this.completedLessons.length;
  }

  static create(data?: Partial<CourseProgressPrimitives>): CourseProgress {
    // Backwards compatibility: if old `lastLessonCompletedId` exists, convert it.
    const completed = data?.completedLessons ?? (data?.lastLessonCompletedId ? [data.lastLessonCompletedId] : []);
    
    return new CourseProgress(
      data?.nextLessonId || '',
      completed,
      data?.percentage || 0,
      data?.completedAt
    );
  }

  markLessonCompleted(lessonId: string, nextLessonId: string, totalLessons: number): CourseProgress {
    const newCompletedLessons = [...new Set([...this.completedLessons, lessonId])];
    const newCompletedCount = newCompletedLessons.length;
    const newPercentage = totalLessons > 0 
      ? Math.round((newCompletedCount / totalLessons) * 100)
      : 0;
      
    return new CourseProgress(
      nextLessonId,
      newCompletedLessons,
      newPercentage,
      newPercentage >= 100 ? new Date() : this.completedAt
    );
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.completedLessons.includes(lessonId);
  }

  updateNextLesson(nextLessonId: string): CourseProgress {
    return new CourseProgress(
      this.nextLessonId,
      this.completedLessons,
      this.percentage,
      this.completedAt
    );
  }

  recalculatePercentage(totalLessons: number): CourseProgress {
    const newPercentage = totalLessons > 0
      ? Math.round((this.completedCount / totalLessons) * 100)
      : 0;
    return new CourseProgress(
      this.nextLessonId,
      this.completedLessons,
      newPercentage,
      this.completedAt
    );
  }

  toPrimitives(): CourseProgressPrimitives {
    const primitives: CourseProgressPrimitives = {
      nextLessonId: this.nextLessonId,
      completedLessons: this.completedLessons,
      completedCount: this.completedCount,
      percentage: this.percentage,
    };

    if (this.completedAt !== undefined) {
      primitives.completedAt = this.completedAt;
    }

    return primitives;
  }
}

export type CourseProgressPrimitives = {
  lastLessonCompletedId?: string; // For backwards compatibility
  nextLessonId: string;
  completedLessons: string[];
  completedCount: number;
  percentage: number;
  completedAt?: Date;
};
