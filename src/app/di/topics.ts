import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseTopicRepository } from "../../context/topics/infrastructure/repository/FirebaseTopicRepository";

// Topic Use Cases - Students
import { FindTopicByIdUseCase } from "../../context/topics/application/FindTopicByIdUseCase";
import { FindTopicsByCourseUseCase } from "../../context/topics/application/FindTopicsByCourseUseCase";

// Topic Use Cases - Admin
import { CreateTopicUseCase } from "../../context/topics/application/CreateTopicUseCase";
import { UpdateTopicUseCase } from "../../context/topics/application/UpdateTopicUseCase";
import { DeleteTopicUseCase } from "../../context/topics/application/DeleteTopicUseCase";

// Topic Controllers - Students
import { FindTopicByIdController } from "../../context/topics/infrastructure/controllers/topics/FindTopicByIdController";
import { FindTopicsByCourseController } from "../../context/topics/infrastructure/controllers/topics/FindTopicsByCourseController";

// Topic Controllers - Admin
import { CreateTopicController } from "../../context/topics/infrastructure/controllers/CreateTopicController";
import { UpdateTopicController } from "../../context/topics/infrastructure/controllers/UpdateTopicController";
import { DeleteTopicController } from "../../context/topics/infrastructure/controllers/DeleteTopicController";

export default function registerTopicsDependencies(container: ContainerBuilder) {
  // ========================================
  // REPOSITORY
  // ========================================
  container.register("TopicRepository", FirebaseTopicRepository);

  // ========================================
  // TOPIC USE CASES (READ ONLY - Student App)
  // ========================================
  container
    .register("FindTopicByIdUseCase", FindTopicByIdUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("FindTopicsByCourseUseCase", FindTopicsByCourseUseCase)
    .addArgument(new Reference("TopicRepository"));

  // ========================================
  // TOPIC CONTROLLERS (READ ONLY - Student App)
  // ========================================
  container
    .register("FindTopicByIdController", FindTopicByIdController)
    .addArgument(new Reference("FindTopicByIdUseCase"));

  container
    .register("FindTopicsByCourseController", FindTopicsByCourseController)
    .addArgument(new Reference("FindTopicsByCourseUseCase"));

  // ========================================
  // TOPIC USE CASES - Admin
  // ========================================
  container
    .register("CreateTopicUseCase", CreateTopicUseCase)
    .addArgument(new Reference("TopicRepository"))
    .addArgument(new Reference("CourseRepository"));

  container
    .register("UpdateTopicUseCase", UpdateTopicUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("DeleteTopicUseCase", DeleteTopicUseCase)
    .addArgument(new Reference("TopicRepository"));

  // ========================================
  // TOPIC CONTROLLERS - Admin
  // ========================================
  container
    .register("CreateTopicController", CreateTopicController)
    .addArgument(new Reference("CreateTopicUseCase"));

  container
    .register("UpdateTopicController", UpdateTopicController)
    .addArgument(new Reference("UpdateTopicUseCase"));

  container
    .register("DeleteTopicController", DeleteTopicController)
    .addArgument(new Reference("DeleteTopicUseCase"));

  return container;
}
