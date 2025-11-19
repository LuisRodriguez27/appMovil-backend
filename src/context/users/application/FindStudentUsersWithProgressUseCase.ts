import { UserRepository } from '../domain/UserRepository';
import { CourseRepository } from '../../courses/domain/CourseRepository';
import { User } from '../domain/User';
import { Course } from '../../courses/domain/Course';

export class FindStudentUsersWithProgressUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository
  ) {}
  async execute(): Promise<User[]> {
    const allUsers = await this.userRepository.findAll();
    const allCourses = await this.courseRepository.findAll();

    const studentUsers = allUsers.filter(user => user.getRole() === 'student');

    const courseMap = new Map<string, Course>();
    allCourses.forEach(course => courseMap.set(course.getId(), course));

    // Recalculate progress percentages based on course total lessons
    const updatedStudents: User[] = studentUsers.map(student => {
      const primitives = student.toPrimitives();

      if (primitives.progress && typeof primitives.progress === 'object') {
        Object.entries(primitives.progress).forEach(([courseId, courseProgress]: [string, any]) => {
          const course = courseMap.get(courseId);
          const totalLessons = course ? course.getTotalLessons() : 0;
          const completedCount = courseProgress?.completedCount || 0;

          const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
          courseProgress.percentage = percentage;

          if (percentage === 100) {
            courseProgress.completedAt = courseProgress.completedAt ? new Date(courseProgress.completedAt) : new Date();
          } else {
            courseProgress.completedAt = undefined;
          }
        });
      }

      return User.fromPrimitives(primitives);
    });

    return updatedStudents;
  }
}



//Revisar por que aqui se recalcula el porcentaje de progreso del usuario en un curso y eso lo debe de hacer el usuario no cada vez que el admin realiza una consulta
