import { CourseRepository } from "../../courses/domain/CourseRepository";
import { User } from "../domain/User";
import { UserRepository } from "../domain/UserRepository";
import { LessonRepository } from "../../lessons/domain/LessonRepository";
import { TopicRepository } from "../../topics/domain/TopicRepository";
import { SubtopicRepository } from "../../subtopics/domain/SubtopicRepository";
import { Subtopic } from "../../subtopics/domain/Subtopic";

export class EnrollUserInCourseUseCase {
  constructor(
    private userRepository: UserRepository,
    private courseRepository: CourseRepository,
    private lessonRepository: LessonRepository,
    private topicRepository: TopicRepository,
    private subtopicRepository: SubtopicRepository
  ) {}

  async run(userId: string, courseId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const course = await this.courseRepository.findById(courseId);
    if (!course) {
      throw new Error("Curso no encontrado");
    }

    const topics = await this.topicRepository.findByCourseId(courseId);
    if (topics.length === 0) {
      throw new Error("No se encontraron temas para este curso. No se puede inscribir al usuario.");
    }

    let allSubtopics: Subtopic[] = [];
    for (const topic of topics) {
      const subtopics = await this.subtopicRepository.findByTopicId(topic.id);
      allSubtopics = allSubtopics.concat(subtopics);
    }

    if (allSubtopics.length === 0) {
      throw new Error("No se encontraron subtemas para este curso. No se puede inscribir al usuario.");
    }

    // Ordenar todos los subtemas por su campo 'order'
    const sortedSubtopics = allSubtopics.sort((a, b) => a.getOrder() - b.getOrder());
    const firstSubtopicId = sortedSubtopics[0].getId();

    const lessons = await this.lessonRepository.findBySubtopicId(sortedSubtopics[0].getTopicId(), firstSubtopicId);
    if (lessons.length === 0) {
      throw new Error("No se encontró ninguna lección para el primer subtema. No se puede inscribir al usuario.");
    }
    // Asumiendo que solo hay una lección por subtema, tomamos la primera
    const firstLessonId = lessons[0].id;

    user.enrollInCourse(courseId, firstLessonId);
    await this.userRepository.update(user);
    
    return user;
  }
}
