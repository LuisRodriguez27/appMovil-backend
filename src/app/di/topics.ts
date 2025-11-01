import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseTopicRepository } from "../../context/topics/infrastructure/repository/FirebaseTopicRepository";
import { FindTopicByIdUseCase } from "../../context/topics/application/FindTopicByIdUseCase";
import { FindTopicsByCourseUseCase } from "../../context/topics/application/FindTopicsByCourseUseCase";
import { FindAllTopicsUseCase } from "../../context/topics/application/FindAllTopicsUseCase";
import { CreateTopicUseCase } from "../../context/topics/application/CreateTopicUseCase";
import { UpdateTopicUseCase } from "../../context/topics/application/UpdateTopicUseCase";
import { DeleteTopicUseCase } from "../../context/topics/application/DeleteTopicUseCase";
import { DeleteSubtopicUseCase } from "../../context/topics/application/DeleteSubtopicUseCase";
import { FindSubtopicByIdUseCase } from "../../context/topics/application/FindSubtopicByIdUseCase";
import { FindSubtopicsByTopicUseCase } from "../../context/topics/application/FindSubtopicsByTopicUseCase";
import { AddSubtopicsUseCase } from "../../context/topics/application/AddSubtopicsUseCase";
import { UpdateSubtopicsUseCase } from "../../context/topics/application/UpdateSubtopicsUseCase";
import { FindTopicByIdController } from "../../context/topics/infrastructure/controllers/FindTopicByIdController";
import { FindTopicsByCourseController } from "../../context/topics/infrastructure/controllers/FindTopicsByCourseController";
import { FindAllTopicsController } from "../../context/topics/infrastructure/controllers/FindAllTopicsController";
import { CreateTopicController } from "../../context/topics/infrastructure/controllers/CreateTopicController";
import { UpdateTopicController } from "../../context/topics/infrastructure/controllers/UpdateTopicController";
import { DeleteTopicController } from "../../context/topics/infrastructure/controllers/DeleteTopicController";
import { AddSubtopicsController } from "../../context/topics/infrastructure/controllers/AddSubtopicsController";
import { UpdateSubtopicController } from "../../context/topics/infrastructure/controllers/UpdateSubtopicController";
import { DeleteSubtopicController } from "../../context/topics/infrastructure/controllers/DeleteSubtopicController";
import { FindSubtopicByIdController } from "../../context/topics/infrastructure/controllers/FindSubtopicByIdController";
import { FindSubtopicsByTopicController } from "../../context/topics/infrastructure/controllers/FindSubtopicsByTopicController";
import { UpdateSubtopicsController } from "../../context/topics/infrastructure/controllers/UpdateSubtopicsController";

export default function registerTopicsDependencies(container: ContainerBuilder) {
  container.register("TopicRepository", FirebaseTopicRepository);

  container
    .register("FindTopicByIdUseCase", FindTopicByIdUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("FindTopicsByCourseUseCase", FindTopicsByCourseUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("FindAllTopicsUseCase", FindAllTopicsUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("FindTopicByIdController", FindTopicByIdController)
    .addArgument(new Reference("FindTopicByIdUseCase"));

  container
    .register("FindTopicsByCourseController", FindTopicsByCourseController)
    .addArgument(new Reference("FindTopicsByCourseUseCase"));

  container
    .register("FindAllTopicsController", FindAllTopicsController)
    .addArgument(new Reference("FindAllTopicsUseCase"));

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

  container
    .register("CreateTopicController", CreateTopicController)
    .addArgument(new Reference("CreateTopicUseCase"));

  container
    .register("UpdateTopicController", UpdateTopicController)
    .addArgument(new Reference("UpdateTopicUseCase"));

  container
    .register("DeleteTopicController", DeleteTopicController)
    .addArgument(new Reference("DeleteTopicUseCase"));

  // Subtopic Use Cases
  container
    .register("DeleteSubtopicUseCase", DeleteSubtopicUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("FindSubtopicByIdUseCase", FindSubtopicByIdUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("FindSubtopicsByTopicUseCase", FindSubtopicsByTopicUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("AddSubtopicsUseCase", AddSubtopicsUseCase)
    .addArgument(new Reference("TopicRepository"));

  container
    .register("UpdateSubtopicsUseCase", UpdateSubtopicsUseCase)
    .addArgument(new Reference("TopicRepository"));

  // Subtopic Controllers
  container
    .register("AddSubtopicsController", AddSubtopicsController)
    .addArgument(new Reference("AddSubtopicsUseCase"));

  container
    .register("UpdateSubtopicController", UpdateSubtopicController)
    .addArgument(new Reference("UpdateSubtopicsUseCase"));

  container
    .register("UpdateSubtopicsController", UpdateSubtopicsController)
    .addArgument(new Reference("UpdateSubtopicsUseCase"));

  container
    .register("DeleteSubtopicController", DeleteSubtopicController)
    .addArgument(new Reference("DeleteSubtopicUseCase"));

  container
    .register("FindSubtopicByIdController", FindSubtopicByIdController)
    .addArgument(new Reference("FindSubtopicByIdUseCase"));

  container
    .register("FindSubtopicsByTopicController", FindSubtopicsByTopicController)
    .addArgument(new Reference("FindSubtopicsByTopicUseCase"));

  return container;
}
