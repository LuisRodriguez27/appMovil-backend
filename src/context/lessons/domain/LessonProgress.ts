export interface LessonProgressPrimitives {
  userId: string;
  lessonId: string;
  completedExercises: string[];
  totalPointsEarned: number;
  attempts: number;
  isCompleted: boolean;
  startedAt: Date;
  lastAccessed: Date;
  completedAt?: Date;
}

export class LessonProgress {
  constructor(
    public readonly userId: string,
    public readonly lessonId: string,
    private completedExercises: string[],
    private totalPointsEarned: number,
    private attempts: number,
    private isCompleted: boolean,
    public readonly startedAt: Date,
    private lastAccessed: Date,
    private completedAt?: Date
  ) {}

  static create(userId: string, lessonId: string): LessonProgress {
    const now = new Date();
    return new LessonProgress(
      userId,
      lessonId,
      [], // completedExercises vacío
      0,  // puntos iniciales
      1,  // primer intento
      false, // no completado
      now,
      now
    );
  }

  static fromPrimitives(data: LessonProgressPrimitives): LessonProgress {
    return new LessonProgress(
      data.userId,
      data.lessonId,
      data.completedExercises,
      data.totalPointsEarned,
      data.attempts,
      data.isCompleted,
      data.startedAt,
      data.lastAccessed,
      data.completedAt
    );
  }

  toPrimitives(): LessonProgressPrimitives {
    return {
      userId: this.userId,
      lessonId: this.lessonId,
      completedExercises: this.completedExercises,
      totalPointsEarned: this.totalPointsEarned,
      attempts: this.attempts,
      isCompleted: this.isCompleted,
      startedAt: this.startedAt,
      lastAccessed: this.lastAccessed,
      completedAt: this.completedAt
    };
  }

  // Métodos de negocio
  public markExerciseAsCompleted(exerciseId: string, pointsEarned: number): void {
    if (!this.completedExercises.includes(exerciseId)) {
      this.completedExercises.push(exerciseId);
      this.totalPointsEarned += pointsEarned;
      this.lastAccessed = new Date();
    }
  }

  public markAsCompleted(): void {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.lastAccessed = new Date();
  }

  public incrementAttempts(): void {
    this.attempts += 1;
    this.lastAccessed = new Date();
  }

  public resetProgress(): void {
    this.completedExercises = [];
    this.totalPointsEarned = 0;
    this.isCompleted = false;
    this.completedAt = undefined;
    this.lastAccessed = new Date();
  }

  // Getters
  public getCompletedExercises(): string[] {
    return [...this.completedExercises];
  }

  public getTotalPointsEarned(): number {
    return this.totalPointsEarned;
  }

  public getAttempts(): number {
    return this.attempts;
  }

  public getIsCompleted(): boolean {
    return this.isCompleted;
  }

  public getLastAccessed(): Date {
    return this.lastAccessed;
  }

  public getCompletedAt(): Date | undefined {
    return this.completedAt;
  }

  public getProgressPercentage(totalExercises: number): number {
    if (totalExercises === 0) return 0;
    return Math.round((this.completedExercises.length / totalExercises) * 100);
  }

  public hasCompletedExercise(exerciseId: string): boolean {
    return this.completedExercises.includes(exerciseId);
  }
}
