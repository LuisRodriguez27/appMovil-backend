import { Lesson } from './Lesson';

export interface LessonRepository {
  findById(id: string): Promise<Lesson | null>;
  findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]>;
  countBySubtopicId(subtopicId: string): Promise<number>;
  findByTopicId(topicId: string): Promise<Lesson[]>;
  findFinalLessonByTopicId(topicId: string): Promise<Lesson | null>;
  countByTopicId(topicId: string): Promise<number>;
  findAll(): Promise<Lesson[]>;
  findByCourseId(courseId: string): Promise<Lesson[]>;
  save(lesson: Lesson): Promise<void>;
  update(lesson: Lesson): Promise<void>;
  delete(id: string): Promise<void>;

  /**
   * Verificar si existe una lección
   */
  existsById(id: string): Promise<boolean>;

  /**
   * Obtener la primera lección de un curso
   * Útil para validación de acceso
   */
  findFirstLessonByCourseId(courseId: string): Promise<Lesson | null>;

  /**
   * Obtener la siguiente lección después de una lección completada
   * Útil para flujo de progreso
   */
  findNextLessonAfter(currentLessonId: string, courseId: string): Promise<Lesson | null>;
}
