export class CourseProgress {
  private constructor(
    public readonly lastLessonCompletedId: string,
    public readonly nextLessonId: string,
    public readonly completedCount: number,
    public readonly percentage: number,
    public readonly completedAt?: Date
  ) {}

  static create(data?: {
    lastLessonCompletedId?: string;
    nextLessonId?: string;
    completedCount?: number;
    percentage?: number;
    completedAt?: Date;
  }): CourseProgress {
    return new CourseProgress(
      data?.lastLessonCompletedId || '',
      data?.nextLessonId || '',
      data?.completedCount || 0,
      data?.percentage || 0,
      data?.completedAt
    );
  }

  markLessonCompleted(lessonId: string, nextLessonId: string, totalLessons: number): CourseProgress {
    const newCompletedCount = this.completedCount + 1;
    const newPercentage = totalLessons > 0 
      ? Math.round((newCompletedCount / totalLessons) * 100)
      : 0;
    return new CourseProgress(
      lessonId,
      nextLessonId,
      newCompletedCount,
      newPercentage,
      newPercentage === 100 ? new Date() : undefined
    );
  }

  isLessonCompleted(lessonId: string): boolean {
    return this.lastLessonCompletedId === lessonId;
  }

  updateNextLesson(nextLessonId: string): CourseProgress {
    return new CourseProgress(
      this.lastLessonCompletedId,
      nextLessonId,
      this.completedCount,
      this.percentage,
      this.completedAt
    );
  }

  recalculatePercentage(totalLessons: number): CourseProgress {
    const newPercentage = totalLessons > 0
      ? Math.round((this.completedCount / totalLessons) * 100)
      : 0;
    return new CourseProgress(
      this.lastLessonCompletedId,
      this.nextLessonId,
      this.completedCount,
      newPercentage,
      this.completedAt
    );
  }

  toPrimitives(): CourseProgressPrimitives {
    return {
      lastLessonCompletedId: this.lastLessonCompletedId,
      nextLessonId: this.nextLessonId,
      completedCount: this.completedCount,
      percentage: this.percentage,
      completedAt: this.completedAt
    };
  }
}

export type CourseProgressPrimitives = {
  lastLessonCompletedId: string;
  nextLessonId: string;
  completedCount: number;
  percentage: number;
  completedAt?: Date;
};
