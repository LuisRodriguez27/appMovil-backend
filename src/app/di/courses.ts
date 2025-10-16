import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseCourseRepository } from "../../context/courses/infrastructure/repository/FirebaseCourseRepository";

// Course Use Cases (READ ONLY)
import { FindCourseByIdUseCase } from "../../context/courses/application/courses/FindCourseByIdUseCase";
import { FindAllCoursesUseCase } from "../../context/courses/application/courses/FindAllCoursesUseCase";

// Course Controllers (READ ONLY)
import { FindAllCoursesController } from "../../context/courses/infrastructure/controllers/courses/FindAllCoursesController";
import { FindCourseByIdController } from "../../context/courses/infrastructure/controllers/courses/FindCourseByIdController";

export default function registerCoursesDependencies(container: ContainerBuilder) {
  // ========================================
  // REPOSITORY
  // ========================================
  container.register("CourseRepository", FirebaseCourseRepository);

  // ========================================
  // COURSE USE CASES (READ ONLY - Student App)
  // ========================================
  container
    .register("FindCourseByIdUseCase", FindCourseByIdUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("FindAllCoursesUseCase", FindAllCoursesUseCase)
    .addArgument(new Reference("CourseRepository"));

  // ========================================
  // COURSE CONTROLLERS (READ ONLY - Student App)
  // ========================================
  container
    .register("FindCourseByIdController", FindCourseByIdController)
    .addArgument(new Reference("FindCourseByIdUseCase"));

  container
    .register("FindAllCoursesController", FindAllCoursesController)
    .addArgument(new Reference("FindAllCoursesUseCase"));

  return container;
}
