import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FireBaseSubtopicRepository } from "../../context/subtopics/infrastructure/repository/FireBaseSubtopic";
import { CreateSubtopicUseCase } from "../../context/subtopics/application/CreateSubtopicUseCase";
import { CreateSubtopicController } from "../../context/subtopics/infrastructure/controllers/CreateSubtopicController";

export default function registerSubtopicsDependencies(container: ContainerBuilder) {
	container.register("SubtopicRepository", FireBaseSubtopicRepository);

	// Use Cases
	container
		.register("CreateSubtopicUseCase", CreateSubtopicUseCase)
		.addArgument(new Reference("SubtopicRepository"))
		.addArgument(new Reference("TopicRepository"));

	// Controllers
	container
		.register("CreateSubtopicController", CreateSubtopicController)
		.addArgument(new Reference("CreateSubtopicUseCase"));


	return container;	
}	