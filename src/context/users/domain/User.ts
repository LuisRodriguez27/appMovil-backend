import { uid } from 'uid';

export class User {
  constructor(
    public readonly id: string,
    private controlNumber: string,
    private name: string,
    private email: string,
    private xp: number,
    private level: number,
    private currentCourse: string | null,
    private profilePicture: string | null,

    public readonly createdAt: Date = new Date()
  ) {}

  static create(data: Omit<UserPrimitives, 'id' | 'createdAt'>): User {
    return new User(
      uid(),
      data.controlNumber,
      data.name,
      data.email,
      data.xp || 0,
      data.level || 1,
      data.currentCourse || null,
      data.profilePicture || null,
    );
  }

  static fromPrimitives(data: UserPrimitives): User {
    return new User(
      data.id,
      data.controlNumber,
      data.name,
      data.email,
      data.xp,
      data.level,
      data.currentCourse,
      data.profilePicture, 
      new Date(data.createdAt)
    );
  }

  public update(data: Partial<UserPrimitives>): void {
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


  private recalculateLevel(): void {
    // Fórmula: level = floor(sqrt(xp / 100)) + 1
    this.level = Math.floor(Math.sqrt(this.xp / 100)) + 1;
  }

  // Getters
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

  toPrimitives(): UserPrimitives {
    return {
      id: this.id,
      controlNumber: this.controlNumber,
      name: this.name,
      email: this.email,
      xp: this.xp,
      level: this.level,
      currentCourse: this.currentCourse,
      profilePicture: this.profilePicture,

      createdAt: this.createdAt.toISOString(),
    };
  }
}

export type UserPrimitives = {
  id: string;
  controlNumber: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  currentCourse: string | null;
  profilePicture: string | null;

  createdAt: string;
};
