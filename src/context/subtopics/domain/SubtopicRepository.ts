import { Subtopic } from "./Subtopic";

export interface SubtopicRepository {
  create(subtopic: Subtopic): Promise<void>;
  findById(id: string): Promise<Subtopic | null>;
  findAll(): Promise<Subtopic[]>;
  findByTopicId(topicId: string): Promise<Subtopic[]>;
  update(subtopic: Subtopic): Promise<void>;
  delete(id: string): Promise<void>;
}