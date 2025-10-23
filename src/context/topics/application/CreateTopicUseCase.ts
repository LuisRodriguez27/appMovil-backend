import { TopicRepository } from "../domain/TopicRepository";
import { Topic } from "../domain/Topic";
import { CreateTopicRequest } from "./requests/CreateTopicRequest";
import { CourseRepository } from "../../courses/domain/CourseRepository";

export class CreateTopicUseCase {
  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly courseRepository: CourseRepository
  ) {}

  async execute(request: CreateTopicRequest): Promise<Topic> {
    // Verificar que el curso existe
    const course = await this.courseRepository.findById(request.courseId);
    if (!course) {
      throw new Error('El curso especificado no existe');
    }

    // Verificar que no exista un topic con el mismo título en el mismo curso
    // NOTA: Esta query requiere un índice compuesto en Firestore (course_id + order)
    // Si no existe, crear en: https://console.firebase.google.com/project/plataforma-estudio/firestore/indexes
    const topicsInCourse = await this.topicRepository.findByCourseId(request.courseId);
    const existingTopicByTitle = topicsInCourse.find(
      topic => topic.getTitle().toLowerCase() === request.title.trim().toLowerCase()
    );

    if (existingTopicByTitle) {
      throw new Error('Ya existe un tema con este título en el curso');
    }

    // Crear el topic
    const topic = Topic.create({
      courseId: request.courseId,
      title: request.title.trim(),
      description: request.description.trim(),
      order: request.order
    });

    // Persistir
    await this.topicRepository.create(topic);

    return topic;
  }
}
