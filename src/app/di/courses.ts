import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseCourseRepository } from "../../context/courses/infrastructure/repository/FirebaseCourseRepository";
import { FindCourseByIdUseCase } from "../../context/courses/application/FindCourseByIdUseCase";
import { FindAllCoursesUseCase } from "../../context/courses/application/FindAllCoursesUseCase";
import { CreateCourseUseCase } from "../../context/courses/application/CreateCourseUseCase";
import { UpdateCourseUseCase } from "../../context/courses/application/UpdateCourseUseCase";
import { DeleteCourseUseCase } from "../../context/courses/application/DeleteCourseUseCase";
import { FindAllCoursesController } from "../../context/courses/infrastructure/controllers/FindAllCoursesController";
import { FindCourseByIdController } from "../../context/courses/infrastructure/controllers/FindCourseByIdController";
import { CreateCourseController } from "../../context/courses/infrastructure/controllers/CreateCourseController";
import { UpdateCourseController } from "../../context/courses/infrastructure/controllers/UpdateCourseController";
import { DeleteCourseController } from "../../context/courses/infrastructure/controllers/DeleteCourseController";

export default function registerCoursesDependencies(container: ContainerBuilder) {
  container.register("CourseRepository", FirebaseCourseRepository);

  container
    .register("FindCourseByIdUseCase", FindCourseByIdUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("FindAllCoursesUseCase", FindAllCoursesUseCase)
    .addArgument(new Reference("CourseRepository"));

  container
    .register("FindCourseByIdController", FindCourseByIdController)
    .addArgument(new Reference("FindCourseByIdUseCase"));

  container
    .register("FindAllCoursesController", FindAllCoursesController)
    .addArgument(new Reference("FindAllCoursesUseCase"));

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
