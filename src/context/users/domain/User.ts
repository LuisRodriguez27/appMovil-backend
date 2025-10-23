import { uid } from 'uid';
import { Progress, ProgressPrimitives } from './value-objects/Progress';
import { AchievementCollection, AchievementPrimitives } from './value-objects/Achievement';
import { StreakData, StreakDataPrimitives } from './value-objects/StreakData';
import { UserStats, UserStatsPrimitives } from './value-objects/UserStats';


export class User {
  constructor(
    public readonly id: string,
    private controlNumber: string,
    private name: string,
    private email: string,
    private role: 'student' | 'admin',
    private xp: number,
    private level: number,
    private currentCourse: string | null,
    private profilePicture: string | null,
    private progress: Progress,
    private achievements: AchievementCollection,
    private streakData: StreakData,
    private stats: UserStats
  ) {}

  static create(data: Omit<UserPrimitives, 'id'>): User {
    return new User(
      uid(),
      data.controlNumber,
      data.name,
      data.email,
      data.role || 'student', // Por defecto: student
      data.xp || 0,
      data.level || 1,
      data.currentCourse || null,
      data.profilePicture || null,
      Progress.create(data.progress),
      AchievementCollection.fromArray(data.achievements || []),
      StreakData.fromPrimitives(data.streakData || {
        current_streak: 0,
        best_streak: 0,
        last_study_date: '',
      }),
      UserStats.fromPrimitives(data.stats || {
        total_lessons_completed: 0,
        total_exercises_completed: 0,
        total_courses_completed: 0,
      })
    );
  }

  static fromPrimitives(data: UserPrimitives): User {
    return new User(
      data.id,
      data.controlNumber,
      data.name,
      data.email,
      data.role,
      data.xp,
      data.level,
      data.currentCourse,
      data.profilePicture,
      Progress.create(data.progress),
      AchievementCollection.fromArray(data.achievements),
      StreakData.fromPrimitives(data.streakData),
      UserStats.fromPrimitives(data.stats)
    );
  }

  // ========== MÉTODOS DE ACTUALIZACIÓN ==========

  public update(data: Partial<Pick<UserPrimitives, 'name' | 'email' | 'currentCourse' | 'profilePicture'>>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.currentCourse !== undefined) this.currentCourse = data.currentCourse;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
  }

  public addXP(points: number): void {
    if (points < 0) {
      throw new Error('XP points cannot be negative');
    }
    this.xp += points;
    this.recalculateLevel();
  }

  public completeLesson(courseId: string, lessonId: string, totalLessons: number): void {
    this.progress = this.progress.completeLesson(courseId, lessonId, totalLessons);
    this.stats = this.stats.incrementLessonsCompleted();
  }

  public updateLastViewedLesson(courseId: string, lessonId: string): void {
    this.progress = this.progress.updateLastViewedLesson(courseId, lessonId);
  }

  public unlockAchievement(achievementId: string): boolean {
    if (this.achievements.has(achievementId)) {
      return false; // Ya tiene el logro
    }
    
    const achievement = require('./value-objects/Achievement').Achievement.create(achievementId);
    this.achievements = this.achievements.add(achievement);
    return true;
  }

  public updateStreak(today: string): void {
    this.streakData = this.streakData.updateStreak(today);
  }

  public addStudyTime(minutes: number): void {
    this.stats = this.stats.addStudyTime(minutes);
  }

  public completeExercise(score: number): void {
    this.stats = this.stats.incrementExercisesCompleted(score);
  }

  public completeCourse(): void {
    this.stats = this.stats.incrementCoursesCompleted();
  }

  private recalculateLevel(): void {
    // Fórmula: level = floor(sqrt(xp / 100)) + 1
    this.level = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  }

  // ========== GETTERS ==========

  public getId(): string {
    return this.id;
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

  public getLevel(): number {
    return this.level;
  }

  public getCurrentCourse(): string | null {
    return this.currentCourse;
  }

  public getProfilePicture(): string | null {
    return this.profilePicture;
  }

  public getProgress(): Progress {
    return this.progress;
  }

  public getAchievements(): AchievementCollection {
    return this.achievements;
  }

  public getStreakData(): StreakData {
    return this.streakData;
  }

  public getStats(): UserStats {
    return this.stats;
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
    return this.achievements.has(achievementId);
  }

  public isStreakActive(today: string): boolean {
    return this.streakData.isActive(today);
  }

  // ========== SERIALIZACIÓN ==========

  toPrimitives(): UserPrimitives {
    return {
      id: this.id,
      controlNumber: this.controlNumber,
      name: this.name,
      email: this.email,
      role: this.role,
      xp: this.xp,
      level: this.level,
      currentCourse: this.currentCourse,
      profilePicture: this.profilePicture,
      progress: this.progress.toPrimitives(),
      achievements: this.achievements.toPrimitives(),
      streakData: this.streakData.toPrimitives(),
      stats: this.stats.toPrimitives()
    };
  }
}

export type UserPrimitives = {
  id: string;
  controlNumber: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  xp: number;
  level: number;
  currentCourse: string | null;
  profilePicture: string | null;
  progress: ProgressPrimitives;
  achievements: AchievementPrimitives[];
  streakData: StreakDataPrimitives;
  stats: UserStatsPrimitives;
};
