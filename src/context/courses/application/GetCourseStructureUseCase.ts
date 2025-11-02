import { CourseRepository } from "../domain/CourseRepository";
import { TopicRepository } from "../../topics/domain/TopicRepository";
import { LessonRepository } from "../../lessons/domain/LessonRepository";

interface SubtopicWithCount {
  id: string;
  title: string;
  description: string;
  order: number;
  lessonCount: number;
}

interface TopicWithSubtopics {
  id: string;
  title: string;
  description: string;
  order: number;
  subtopics: SubtopicWithCount[];
}

interface CourseStructureResponse {
  course: {
    id: string;
    title: string;
    description: string;
    totalTopics: number;
    totalLessons: number;
  };
  topics: TopicWithSubtopics[];
}

export class GetCourseStructureUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly topicRepository: TopicRepository,
    private readonly lessonRepository: LessonRepository
  ) {}

  async execute(courseId: string): Promise<CourseStructureResponse> {
    // 1. Validar que el ID no esté vacío
    if (!courseId || courseId.trim().length === 0) {
      throw new Error('ID del curso es requerido');
    }

    // 2. Obtener curso
    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error('Curso no encontrado');
    }

    // 3. Obtener todos los topics del curso (ordenados por 'order')
    const topics = await this.topicRepository.findByCourseId(courseId);

    // 4. Para cada topic, contar las lecciones de cada subtopic
    const topicsWithCounts: TopicWithSubtopics[] = await Promise.all(
      topics.map(async (topic) => {
        const topicPrimitives = topic.toPrimitives();

        // Para cada subtopic, contar sus lecciones
        const subtopicsWithCounts: SubtopicWithCount[] = await Promise.all(
          topicPrimitives.subtopics.map(async (subtopic) => {
            const lessonCount = await this.lessonRepository.countBySubtopicId(subtopic.id);

            return {
              id: subtopic.id,
              title: subtopic.title,
              description: subtopic.description,
              order: subtopic.order,
              lessonCount: lessonCount
            };
          })
        );

        return {
          id: topicPrimitives.id,
          title: topicPrimitives.title,
          description: topicPrimitives.description,
          order: topicPrimitives.order,
          subtopics: subtopicsWithCounts
        };
      })
    );

    // 5. Retornar estructura completa
    const coursePrimitives = course.toPrimitives();

    return {
      course: {
        id: coursePrimitives.id,
        title: coursePrimitives.title,
        totalTopics: coursePrimitives.totalTopics,
        totalLessons: coursePrimitives.totalLessons,
        description: coursePrimitives.description ?? '',
      },
      topics: topicsWithCounts
    };
  }
}
