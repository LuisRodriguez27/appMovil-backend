import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseTopicRepository } from "../../context/topics/infrastructure/repository/FirebaseTopicRepository";

// Topic Use Cases (READ ONLY)
import { FindTopicByIdUseCase } from "../../context/topics/application/topics/FindTopicByIdUseCase";
import { FindTopicsByCourseUseCase } from "../../context/topics/application/topics/FindTopicsByCourseUseCase";

// Topic Controllers (READ ONLY)
import { FindTopicByIdController } from "../../context/topics/infrastructure/controllers/topics/FindTopicByIdController";
import { FindTopicsByCourseController } from "../../context/topics/infrastructure/controllers/topics/FindTopicsByCourseController";

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

  return container;
}
