import { UserRepository } from '../../users/domain/UserRepository';
import { LessonRepository } from '../../lessons/domain/LessonRepository';
import { TopicRepository } from '../../topics/domain/TopicRepository';
import { SubtopicRepository } from '../../subtopics/domain/SubtopicRepository';
import { CurrentAttempt } from '../../users/domain/value-objects/CurrentAttempt';
import { v4 as uuidv4 } from 'uuid';
import { Subtopic } from '../../subtopics/domain/Subtopic';
import { Lesson } from '../../lessons/domain/Lesson';

export interface SubmitExerciseAnswerRequest {
  userId: string;
  lessonId: string;
  courseId: string;
  score: number;
}

export interface SubmitExerciseAnswerResponse {
  attemptId: string;
  status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
  message: string;
  score: number;
  nextLessonId?: string;
}

export class SubmitExerciseAnswerUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly topicRepository: TopicRepository,
    private readonly subtopicRepository: SubtopicRepository
  ) {}

  async execute(request: SubmitExerciseAnswerRequest): Promise<SubmitExerciseAnswerResponse> {
    // 1. Verificar que el usuario existe
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error(`Usuario con ID ${request.userId} no encontrado`);
    }

    // 2. Verificar que la lección existe
    const lesson = await this.lessonRepository.findById(request.lessonId);
    if (!lesson) {
      throw new Error(`Lección con ID ${request.lessonId} no encontrada`);
    }

    // 3. Verificar que la lección tiene ejercicio
    const lessonPrimitives = lesson.toPrimitives();
    if (!lessonPrimitives.exerciseConfig) {
      throw new Error(`La lección ${request.lessonId} no tiene ejercicio configurado`);
    }

    // 4. Determinar el estado según el score
    let status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
    if (request.score >= 90) {
      status = 'approvedExcellent';
    } else if (request.score >= 70) {
      status = 'approvedImprove';
    } else {
      status = 'rejected';
    }

    // 5. Generar ID de intento único
    const attemptId = uuidv4();

    // 6. Crear el intento
    const attempt = CurrentAttempt.create({
      lessonId: request.lessonId,
      attemptId,
      courseId: request.courseId,
      status: status,
      userAnswer: '[Evaluated on Client]', 
      createdAt: new Date(),
      aiFeedback: {
        score: request.score,
        feedback: status === 'rejected' ? 'Inténtalo de nuevo.' : '¡Bien hecho!',
        suggestions: ''
      }
    });

    // 7. Actualizar el usuario con el intento
    user.createAttempt(attempt);

    let nextLessonIdString = '';

    // 8. Si aprobó, actualizar progreso
    if (status === 'approvedExcellent' || status === 'approvedImprove') {
      const allLessonsForCourse = await this.lessonRepository.findByCourseId(request.courseId);

      // Calcular nextLessonId
      nextLessonIdString = await this.findNextLessonId(request.courseId, request.lessonId, allLessonsForCourse);

      // Actualizar lección completada
      user.completeLesson(
        request.courseId, 
        request.lessonId, 
        nextLessonIdString, 
        allLessonsForCourse.length // Usar el número real de lecciones
      );

      // Agregar XP (score / 2)
      user.addXP(Math.floor(request.score / 2));
      
      // Actualizar estadísticas generales
      user.completeExercise(request.score);
    }

    // 9. Guardar usuario actualizado (cubre createAttempt y updateProgress)
    await this.userRepository.update(user);

    return {
      attemptId,
      status,
      message: status === 'rejected' ? 'Inténtalo de nuevo' : '¡Ejercicio completado!',
      score: request.score,
      nextLessonId: nextLessonIdString || undefined
    };
  }

  private async findNextLessonId(courseId: string, currentLessonId: string, lessons: Lesson[]): Promise<string> {
    // Obtener todos los datos necesarios para ordenar
    const topics = await this.topicRepository.findByCourseId(courseId);
    
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

    console.log('Sorted lessons:', lessons.map(l => ({ id: l.id, topic: l.topicId, subtopic: l.subtopicId, created: l.createdAt }) ));
    
    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    console.log(`Current lesson ID: ${currentLessonId}, Found at index: ${currentIndex}`);

    // Encontrar lección actual y siguiente
    if (currentIndex !== -1 && currentIndex < lessons.length - 1) {
      console.log(`Next lesson ID: ${lessons[currentIndex + 1].id}`);
      return lessons[currentIndex + 1].id;
    }

    console.log('No next lesson found.');
    return ''; // No hay siguiente lección (fin del curso)
  }
}