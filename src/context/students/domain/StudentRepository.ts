import { Student, StudentPrimitives } from "./Student";

export interface StudentRepository {
  add(student: Student): Promise<void>;

  findById(id: string): Promise<Student | null>;

  findAll(): Promise<Student[]>;

  update(student: Student): Promise<void>;
  
  delete(id: string): Promise<void>;
}  