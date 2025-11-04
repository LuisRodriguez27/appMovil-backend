import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FireBaseSubtopicRepository } from "../../context/subtopics/infrastructure/repository/FireBaseSubtopic";
import { CreateSubtopicUseCase } from "../../context/subtopics/application/CreateSubtopicUseCase";
import { CreateSubtopicController } from "../../context/subtopics/infrastructure/controllers/CreateSubtopicController";
import { FindAllSubtopicsUseCase } from "../../context/subtopics/application/FindAllSubtopicsUseCase";
import { FindAllSubtopicsController } from "../../context/subtopics/infrastructure/controllers/FindAllSubtopicsController";

export default function registerSubtopicsDependencies(container: ContainerBuilder) {
	container.register("SubtopicRepository", FireBaseSubtopicRepository);

	// Use Cases
	container
		.register("CreateSubtopicUseCase", CreateSubtopicUseCase)
		.addArgument(new Reference("SubtopicRepository"))
		.addArgument(new Reference("TopicRepository"));

	container
		.register("FindAllSubtopicsUseCase", FindAllSubtopicsUseCase)
		.addArgument(new Reference("SubtopicRepository"));

	// Controllers
	container
		.register("CreateSubtopicController", CreateSubtopicController)
		.addArgument(new Reference("CreateSubtopicUseCase"));

	container
		.register("FindAllSubtopicsController", FindAllSubtopicsController)
		.addArgument(new Reference("FindAllSubtopicsUseCase"));

	return container;	
}	