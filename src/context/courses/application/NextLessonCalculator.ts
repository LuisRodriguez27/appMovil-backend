import { TopicRepository } from '../../topics/domain/TopicRepository';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { Subtopic } from '../../subtopics/domain/Subtopic';

export class NextLessonCalculator {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly subtopicRepository: SubtopicRepository,
    private readonly lessonRepository: LessonRepository
  ) {}

  public async findNextLessonId(courseId: string, currentLessonId: string): Promise<string> {
    // Obtener todos los datos necesarios para ordenar
    const topics = await this.topicRepository.findByCourseId(courseId);
    const lessons = await this.lessonRepository.findByCourseId(courseId);
    
    // Obtener subtemas para todos los temas
    const subtopicsMap = new Map<string, Subtopic[]>();
    for (const topic of topics) {
      const subtopics = await this.subtopicRepository.findByTopicId(topic.id);
      subtopicsMap.set(topic.id, subtopics);
    }

    // Mapas para búsqueda rápida de orden
    const topicOrder = new Map(topics.map(t => [t.id, t.getOrder()]));
    
    const subtopicOrder = new Map<string, number>();
    subtopicsMap.forEach((subtopics) => {
      subtopics.forEach(s => subtopicOrder.set(s.id, s.getOrder()));
    });

    // Ordenar lecciones
    lessons.sort((a, b) => {
      const topicOrderA = topicOrder.get(a.topicId) ?? 999;
      const topicOrderB = topicOrder.get(b.topicId) ?? 999;

      if (topicOrderA !== topicOrderB) {
        return topicOrderA - topicOrderB;
      }

      const subtopicOrderA = a.subtopicId ? (subtopicOrder.get(a.subtopicId) ?? 999) : 999;
      const subtopicOrderB = b.subtopicId ? (subtopicOrder.get(b.subtopicId) ?? 999) : 999;

      if (subtopicOrderA !== subtopicOrderB) {
        return subtopicOrderA - subtopicOrderB;
      }

      // Si están en el mismo subtema, usar el orden de la lección
      const lessonOrderA = a.toPrimitives().order;
      const lessonOrderB = b.toPrimitives().order;
      return lessonOrderA - lessonOrderB;
    });

    // Encontrar lección actual y siguiente
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    
    if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
      return lessons[currentIndex + 1].id;
    }

    return ''; // No hay siguiente lección (fin del curso)
  }
}
