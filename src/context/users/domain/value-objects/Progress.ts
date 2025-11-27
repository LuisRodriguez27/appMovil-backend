import { CourseProgress } from './CourseProgress';

export class Progress {
  private constructor(
    public readonly courses: Map<string, CourseProgress>
  ) {}

  static create(data?: Record<string, any>): Progress {
    const coursesMap = new Map<string, CourseProgress>();
    if (data) {
      Object.entries(data).forEach(([courseId, courseData]) => {
        coursesMap.set(courseId, CourseProgress.create(courseData));
      });
    }
    return new Progress(coursesMap);
  }

  getCourseProgress(courseId: string): CourseProgress | undefined {
    return this.courses.get(courseId);
  }

  updateCourseProgress(courseId: string, courseProgress: CourseProgress): Progress {
    const newCourses = new Map(this.courses);
    newCourses.set(courseId, courseProgress);
    return new Progress(newCourses);
  }

  initializeCourseProgress(courseId: string, firstLessonId: string): Progress {
    if (this.courses.has(courseId)) {
      return this; // Already initialized
    }
    const newCourses = new Map(this.courses);
    newCourses.set(courseId, CourseProgress.create({ nextLessonId: firstLessonId }));
    return new Progress(newCourses);
  }

  completeLesson(courseId: string, lessonId: string, nextLessonId: string, totalLessons: number): Progress {
    const currentProgress = this.courses.get(courseId) || CourseProgress.create();
    const updatedProgress = currentProgress.markLessonCompleted(lessonId, nextLessonId, totalLessons);
    return this.updateCourseProgress(courseId, updatedProgress);
  }

  isLessonCompleted(courseId: string, lessonId: string): boolean {
    const courseProgress = this.courses.get(courseId);
    return courseProgress ? courseProgress.isLessonCompleted(lessonId) : false;
  }

  updateNextLesson(courseId: string, nextLessonId: string): Progress {
    const currentProgress = this.courses.get(courseId) || CourseProgress.create();
    const updatedProgress = currentProgress.updateNextLesson(nextLessonId);
    return this.updateCourseProgress(courseId, updatedProgress);
  }

  getTotalLessonsCompleted(): number {
    let total = 0;
    this.courses.forEach(courseProgress => {
      total += courseProgress.completedCount;
    });
    return total;
  }

  getAverageCompletionPercentage(): number {
    if (this.courses.size === 0) return 0;
    
    let totalPercentage = 0;
    this.courses.forEach(courseProgress => {
      totalPercentage += courseProgress.percentage;
    });
    
    return Math.round(totalPercentage / this.courses.size);
  }

  toPrimitives(): ProgressPrimitives {
    const result: Record<string, any> = {};
    this.courses.forEach((courseProgress, courseId) => {
      result[courseId] = courseProgress.toPrimitives();
    });
    return result;
  }
}

export type ProgressPrimitives = Record<string, any>;
