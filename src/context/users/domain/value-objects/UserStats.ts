export class UserStats {
  private constructor(
    public readonly totalLessonsCompleted: number,
    public readonly totalExercisesCompleted: number,
    public readonly totalCoursesCompleted: number
  ) {}

  static create(data?: {
    totalLessonsCompleted?: number;
    totalExercisesCompleted?: number;
    totalCoursesCompleted?: number;
  }): UserStats {
    return new UserStats(
      data?.totalLessonsCompleted || 0,
      data?.totalExercisesCompleted || 0,
      data?.totalCoursesCompleted || 0
    );
  }

  static fromPrimitives(data?: {
    totalLessonsCompleted?: number;
    totalExercisesCompleted?: number;
    totalCoursesCompleted?: number;
  }): UserStats {
    return new UserStats(
      data?.totalLessonsCompleted || 0,
      data?.totalExercisesCompleted || 0,
      data?.totalCoursesCompleted || 0
    );
  }

  incrementLessonsCompleted(count: number = 1): UserStats {
    return new UserStats(
      this.totalLessonsCompleted + count,
      this.totalExercisesCompleted,
      this.totalCoursesCompleted
    );
  }

  incrementExercisesCompleted(score: number): UserStats {
    const newTotal = this.totalExercisesCompleted + 1;
    return new UserStats(
      this.totalLessonsCompleted,
      newTotal,
      this.totalCoursesCompleted
    );
  }

  incrementCoursesCompleted(): UserStats {
    return new UserStats(
      this.totalLessonsCompleted,
      this.totalExercisesCompleted,
      this.totalCoursesCompleted + 1
    );
  }

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

  isActive(): boolean {
    return this.totalLessonsCompleted > 0 || this.totalExercisesCompleted > 0;
  }

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

  toPrimitives(): UserStatsPrimitives {
    return {
      totalLessonsCompleted: this.totalLessonsCompleted,
      totalExercisesCompleted: this.totalExercisesCompleted,
      totalCoursesCompleted: this.totalCoursesCompleted
    };
  }
}

export type UserStatsPrimitives = {
  totalLessonsCompleted: number;
  totalExercisesCompleted: number;
  totalCoursesCompleted: number;
};
