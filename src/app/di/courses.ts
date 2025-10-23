import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseCourseRepository } from "../../context/courses/infrastructure/repository/FirebaseCourseRepository";

// Course Use Cases - Students
import { FindCourseByIdUseCase } from "../../context/courses/application/FindCourseByIdUseCase";
import { FindAllCoursesUseCase } from "../../context/courses/application/FindAllCoursesUseCase";

// Course Use Cases - Admin
import { CreateCourseUseCase } from "../../context/courses/application/CreateCourseUseCase";
import { UpdateCourseUseCase } from "../../context/courses/application/UpdateCourseUseCase";
import { DeleteCourseUseCase } from "../../context/courses/application/DeleteCourseUseCase";

// Course Controllers - Students
import { FindAllCoursesController } from "../../context/courses/infrastructure/controllers/FindAllCoursesController";
import { FindCourseByIdController } from "../../context/courses/infrastructure/controllers/FindCourseByIdController";

// Course Controllers - Admin
import { CreateCourseController } from "../../context/courses/infrastructure/controllers/CreateCourseController";
import { UpdateCourseController } from "../../context/courses/infrastructure/controllers/UpdateCourseController";
import { DeleteCourseController } from "../../context/courses/infrastructure/controllers/DeleteCourseController";

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
  // COURSE CONTROLLERS - Students
  // ========================================
  container
    .register("FindCourseByIdController", FindCourseByIdController)
    .addArgument(new Reference("FindCourseByIdUseCase"));

  container
    .register("FindAllCoursesController", FindAllCoursesController)
    .addArgument(new Reference("FindAllCoursesUseCase"));

  // ========================================
  // COURSE USE CASES - Admin
  // ========================================
  container
    .register("CreateCourseUseCase", CreateCourseUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("UpdateCourseUseCase", UpdateCourseUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("DeleteCourseUseCase", DeleteCourseUseCase)
    .addArgument(new Reference("CourseRepository"))
    .addArgument(new Reference("TopicRepository")); // Necesita TopicRepository para cascada

  // ========================================
  // COURSE CONTROLLERS - Admin
  // ========================================
  container
    .register("CreateCourseController", CreateCourseController)
    .addArgument(new Reference("CreateCourseUseCase"));

  container
    .register("UpdateCourseController", UpdateCourseController)
    .addArgument(new Reference("UpdateCourseUseCase"));

  container
    .register("DeleteCourseController", DeleteCourseController)
    .addArgument(new Reference("DeleteCourseUseCase"));

  return container;
}
