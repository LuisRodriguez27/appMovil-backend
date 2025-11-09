import { StreakData, UserStats, CurrentAttempt } from './value-objects';
import { UserAchievement } from './value-objects/Achievement';
import { Progress, ProgressPrimitives } from './value-objects/Progress';
import { StreakDataPrimitives } from './value-objects/StreakData';
import { UserStatsPrimitives } from './value-objects/UserStats';
import { CurrentAttemptPrimitives } from './value-objects/CurrentAttempt';

export class User {
  constructor(
    public readonly __id: string,
    private controlNumber: string,
    private name: string,
    private email: string,
    private role: 'student' | 'admin',
    private xp: number,
    private progress: Progress,
    private achievements: UserAchievement[],
    private streakData: StreakData,
    private stats: UserStats,
    private currentCourseId?: string,
    private profilePicture?: string,
    private currentAttempt?: CurrentAttempt,
    private readonly createdAt: Date = new Date()
  ) {}

  static create(data: Omit<UserPrimitives, '__id' | 'createdAt'>): User {
    return new User(
      '', // __id se debe asignar externamente o por Firestore
      data.controlNumber,
      data.name,
      data.email,
      data.role || 'student',
      data.xp || 0,
      Progress.create(data.progress),
      data.achievements || [],
      StreakData.fromPrimitives(data.streakData || { currentStreak: 0, bestStreak: 0, lastStudyDate: null }),
      UserStats.fromPrimitives(data.stats || { totalLessonsCompleted: 0, totalExercisesCompleted: 0, totalCoursesCompleted: 0 }),
      data.currentCourseId,
      data.profilePicture,
      data.currentAttempt ? CurrentAttempt.fromPrimitives(data.currentAttempt) : undefined,
      new Date()
    );
  }

  static fromPrimitives(data: UserPrimitives): User {
    return new User(
      data.__id,
      data.controlNumber,
      data.name,
      data.email,
      data.role,
      data.xp,
      Progress.create(data.progress),
      data.achievements,
      StreakData.fromPrimitives(data.streakData),
      UserStats.fromPrimitives(data.stats),
      data.currentCourseId,
      data.profilePicture,
      data.currentAttempt ? CurrentAttempt.fromPrimitives(data.currentAttempt) : undefined,
      new Date(data.createdAt)
    );
  }

  // ========== MÉTODOS DE ACTUALIZACIÓN ==========

  public update(data: Partial<Pick<UserPrimitives, 'name' | 'email' | 'currentCourseId' | 'profilePicture'>>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.currentCourseId !== undefined) this.currentCourseId = data.currentCourseId;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
  }

  public addXP(points: number): void {
    if (points < 0) {
      throw new Error('XP points cannot be negative');
    }
    this.xp += points;
  }

  public completeLesson(courseId: string, lessonId: string, nextLessonId: string, totalLessons: number): void {
    this.progress = this.progress.completeLesson(courseId, lessonId, nextLessonId, totalLessons);
    this.stats = this.stats.incrementLessonsCompleted();
  }

  public updateNextLesson(courseId: string, nextLessonId: string): void {
    this.progress = this.progress.updateNextLesson(courseId, nextLessonId);
  }

  public unlockAchievement(achievementId: string, quantity: number = 1): boolean {
    if (this.achievements.some(a => a.achievementId === achievementId)) {
      return false; // Ya tiene el logro
    }
    this.achievements.push({ achievementId, quantity });
    return true;
  }

  public updateStreak(today: string): void {
    this.streakData = this.streakData.updateStreak(today);
  }

  public addStudyTime(minutes: number): void {
    // No implementado en el esquema actual
  }

  public completeExercise(score: number): void {
    this.stats = this.stats.incrementExercisesCompleted(score);
  }

  public completeCourse(): void {
    this.stats = this.stats.incrementCoursesCompleted();
  }

  public createAttempt(attempt: CurrentAttempt): void {
    this.currentAttempt = attempt;
  }

  public updateAttemptWithEvaluation(evaluation: {
    status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
    score: number;
    feedback: string;
    suggestions?: string;
  }): void {
    if (!this.currentAttempt) {
      throw new Error('No hay un intento activo para evaluar');
    }
    this.currentAttempt = this.currentAttempt.withEvaluation(evaluation);
  }

  public clearCurrentAttempt(): void {
    this.currentAttempt = undefined;
  }

  // Eliminado: recalculateLevel (no existe level en el esquema)

  // ========== GETTERS ==========

  public getId(): string {
    return this.__id;
  }

  public getControlNumber(): string {
    return this.controlNumber;
  }

  public getName(): string {
    return this.name;
  }

  public getEmail(): string {
    return this.email;
  }

  public getXP(): number {
    return this.xp;
  }

  // Eliminado: getLevel (no existe level en el esquema)

  public getCurrentCourseId(): string | undefined {
    return this.currentCourseId;
  }

  public getProfilePicture(): string | undefined {
    return this.profilePicture;
  }

  public getProgress(): Progress {
    return this.progress;
  }

  public getAchievements(): UserAchievement[] {
    return this.achievements;
  }

  public getStreakData(): StreakData {
    return this.streakData;
  }

  public getStats(): UserStats {
    return this.stats;
  }

  public getCurrentAttempt(): CurrentAttempt | undefined {
    return this.currentAttempt;
  }

  public getRole(): 'student' | 'admin' {
    return this.role;
  }

  // ========== QUERIES DE CONVENIENCIA ==========

  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  public isStudent(): boolean {
    return this.role === 'student';
  }

  public changeRole(newRole: 'student' | 'admin'): void {
    this.role = newRole;
  }

  public isLessonCompleted(courseId: string, lessonId: string): boolean {
    return this.progress.isLessonCompleted(courseId, lessonId);
  }

  public hasAchievement(achievementId: string): boolean {
    return this.achievements.some(a => a.achievementId === achievementId);
  }

  public isStreakActive(today: string): boolean {
    return this.streakData.isActive(today);
  }

  // ========== SERIALIZACIÓN ==========

  toPrimitives(): UserPrimitives {
    return {
      __id: this.__id,
      controlNumber: this.controlNumber,
      name: this.name,
      email: this.email,
      role: this.role,
      xp: this.xp,
      currentCourseId: this.currentCourseId,
      profilePicture: this.profilePicture,
      progress: this.progress.toPrimitives(),
      achievements: this.achievements,
      streakData: this.streakData.toPrimitives(),
      stats: this.stats.toPrimitives(),
      currentAttempt: this.currentAttempt?.toPrimitives(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}

export type UserPrimitives = {
  __id: string;
  controlNumber: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  xp: number;
  currentCourseId?: string;
  profilePicture?: string;
  progress: ProgressPrimitives;
  achievements: UserAchievement[];
  streakData: StreakDataPrimitives;
  stats: UserStatsPrimitives;
  currentAttempt?: CurrentAttemptPrimitives;
  createdAt: string;
};
