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
    const course = await this.courseRepository.findById(request.courseId);
    if (!course) {
      throw new Error('El curso especificado no existe');
    }

    // Verificar que no exista un topic con el mismo título en el mismo curso
    // NOTA: Esta query requiere un índice compuesto en Firestore (courseId + order)
    // Si no existe, crear en: https://console.firebase.google.com/project/plataforma-estudio/firestore/indexes
    const topicsInCourse = await this.topicRepository.findByCourseId(request.courseId);
    const existingTopicByTitle = topicsInCourse.find(
      topic => topic.getTitle().toLowerCase() === request.title.trim().toLowerCase()
    );

    if (existingTopicByTitle) {
      throw new Error('Ya existe un tema con este título en el curso');
    }

    const topic = Topic.create({
      courseId: request.courseId,
      title: request.title.trim(),
      order: request.order,
      description: request.description?.trim(),
    });

    await this.topicRepository.create(topic);

    await this.courseRepository.updateCounters(request.courseId, course.getTotalTopics() + 1);

    return topic;
  }
}
