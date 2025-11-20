import { CourseProgress } from '../domain/value-objects/CourseProgress';
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
        const userProgress = primitives.progress; 
        Object.entries(userProgress).forEach(([courseId, courseProgress]: [string, any]) => {
          const course = courseMap.get(courseId);
          const totalLessons = course ? course.getTotalLessons() : 0;
          
          if (totalLessons > 0) {
            const currentCourseProgress = CourseProgress.create(courseProgress);
            const updatedCourseProgress = currentCourseProgress.recalculatePercentage(totalLessons);
            userProgress[courseId] = updatedCourseProgress.toPrimitives();
          }
        });
        primitives.progress = userProgress;
      }

      return User.fromPrimitives(primitives);
    });

    return updatedStudents;
  }
}
