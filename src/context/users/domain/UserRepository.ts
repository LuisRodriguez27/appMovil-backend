import { User } from './User';

export interface UserRepository {
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByNumeroControl(numeroControl: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  updateXP(id: string, xpToAdd: number): Promise<void>;
  updateStreak(id: string, newStreak: number): Promise<void>;
}
