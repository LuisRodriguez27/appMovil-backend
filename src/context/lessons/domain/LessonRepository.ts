import { Lesson } from './Lesson';

export interface LessonRepository {
  /**
   * Buscar lección por ID
   * GET /lessons/:id
   */
  findById(id: string): Promise<Lesson | null>;

  /**
   * Buscar lecciones de un subtema específico (ordenadas)
   * GET /topics/:topicId/subtopics/:subtopicId/lessons
   */
  findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]>;

  /**
   * Contar lecciones de un subtema
   * ⭐ CRÍTICO para GetCourseStructureUseCase del contexto Courses
   */
  countBySubtopicId(subtopicId: string): Promise<number>;

  /**
   * Buscar todas las lecciones de un tema (todos los subtemas)
   * Útil para estadísticas y progreso
   */
  findByTopicId(topicId: string): Promise<Lesson[]>;

  /**
   * Contar lecciones totales de un tema
   * Útil para calcular porcentajes de progreso
   */
  countByTopicId(topicId: string): Promise<number>;

  findAll(): Promise<Lesson[]>;
  findByCourseId(courseId: string): Promise<Lesson[]>;
  findPublishedByCourseId(courseId: string): Promise<Lesson[]>;
  save(lesson: Lesson): Promise<void>;
  update(lesson: Lesson): Promise<void>;
  delete(id: string): Promise<void>;
  existsById(id: string): Promise<boolean>;
}
