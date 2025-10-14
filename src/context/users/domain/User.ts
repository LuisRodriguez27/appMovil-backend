import { uid } from 'uid';

export class User {
  constructor(
    public readonly id: string,
    private numeroControl: string,
    private name: string,
    private email: string,
    private carrera: string,
    private semestre: number,
    private xp: number,
    private level: number,
    private streak: number,
    private currentCourse: string | null,
    private learningStyle: string | null,
    private profilePicture: string | null,
    private preferences: UserPreferences
  ) {}

  static create(data: Omit<UserPrimitives, 'id'>): User {
    return new User(
      uid(),
      data.numeroControl,
      data.name,
      data.email,
      data.carrera,
      data.semestre,
      data.xp || 0,
      data.level || 1,
      data.streak || 0,
      data.currentCourse || null,
      data.learningStyle || null,
      data.profilePicture || null,
      data.preferences || { theme: 'light', notifications: true }
    );
  }

  static fromPrimitives(data: UserPrimitives): User {
    return new User(
      data.id,
      data.numeroControl,
      data.name,
      data.email,
      data.carrera,
      data.semestre,
      data.xp,
      data.level,
      data.streak,
      data.currentCourse,
      data.learningStyle,
      data.profilePicture,
      data.preferences
    );
  }

  public update(data: Partial<UpdateUserData>): void {
    if (data.name !== undefined) this.name = data.name;
    if (data.email !== undefined) this.email = data.email;
    if (data.carrera !== undefined) this.carrera = data.carrera;
    if (data.semestre !== undefined) this.semestre = data.semestre;
    if (data.currentCourse !== undefined) this.currentCourse = data.currentCourse;
    if (data.learningStyle !== undefined) this.learningStyle = data.learningStyle;
    if (data.profilePicture !== undefined) this.profilePicture = data.profilePicture;
    if (data.preferences !== undefined) this.preferences = { ...this.preferences, ...data.preferences };
  }

  public addXP(points: number): void {
    if (points < 0) {
      throw new Error('XP points cannot be negative');
    }
    this.xp += points;
    this.recalculateLevel();
  }

  public updateStreak(newStreak: number): void {
    if (newStreak < 0) {
      throw new Error('Streak cannot be negative');
    }
    this.streak = newStreak;
  }

  private recalculateLevel(): void {
    // Fórmula: level = floor(sqrt(xp / 100)) + 1
    this.level = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public getNumeroControl(): string {
    return this.numeroControl;
  }

  public getName(): string {
    return this.name;
  }

  public getEmail(): string {
    return this.email;
  }

  public getCarrera(): string {
    return this.carrera;
  }

  public getSemestre(): number {
    return this.semestre;
  }

  public getXP(): number {
    return this.xp;
  }

  public getLevel(): number {
    return this.level;
  }

  public getStreak(): number {
    return this.streak;
  }

  public getCurrentCourse(): string | null {
    return this.currentCourse;
  }

  public getLearningStyle(): string | null {
    return this.learningStyle;
  }

  public getProfilePicture(): string | null {
    return this.profilePicture;
  }

  public getPreferences(): UserPreferences {
    return this.preferences;
  }

  public toPrimitives(): UserPrimitives {
    return {
      id: this.id,
      numeroControl: this.numeroControl,
      name: this.name,
      email: this.email,
      carrera: this.carrera,
      semestre: this.semestre,
      xp: this.xp,
      level: this.level,
      streak: this.streak,
      currentCourse: this.currentCourse,
      learningStyle: this.learningStyle,
      profilePicture: this.profilePicture,
      preferences: this.preferences,
    };
  }
}

export type UserPrimitives = {
  id: string;
  numeroControl: string;
  name: string;
  email: string;
  carrera: string;
  semestre: number;
  xp: number;
  level: number;
  streak: number;
  currentCourse: string | null;
  learningStyle: string | null;
  profilePicture: string | null;
  preferences: UserPreferences;
};

export type UserPreferences = {
  theme: 'light' | 'dark';
  notifications: boolean;
};

export type UpdateUserData = {
  name?: string;
  email?: string;
  carrera?: string;
  semestre?: number;
  currentCourse?: string | null;
  learningStyle?: string | null;
  profilePicture?: string | null;
  preferences?: Partial<UserPreferences>;
};
