import { Archivement } from "./Archivement";

export interface ArchivementRepository {
  create(archivement: Archivement): Promise<void>;
  findById(id: string): Promise<Archivement | null>;
  findAll(): Promise<Archivement[]>;
  update(archivement: Archivement): Promise<void>;
  delete(id: string): Promise<void>;
}