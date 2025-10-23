import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FireBaseArchivementRepository } from "../../context/achievements/infrastructure/repository/FireBaseAchievementRepository";
import { CreateArchivementUseCase } from "../../context/achievements/application/CreateAchievementUseCase";
import { FindAllArchivementUseCase } from "../../context/achievements/application/FindAllAchievementsUseCase";
import { FindArchivementByIdUseCase } from "../../context/achievements/application/FindAchievementByIdUseCase";
import { UpdateArchivementUseCase } from "../../context/achievements/application/UpdateAchievementUseCase";
import { DeleteArchivementUseCase } from "../../context/achievements/application/DeleteAchievementUseCase";
import { CreateArchivementController } from "../../context/achievements/infrastructure/controllers/CreateAchievementController";
import { FindAllArchivementController } from "../../context/achievements/infrastructure/controllers/FindAllAchievementsController";
import { FindArchivementByIdController } from "../../context/achievements/infrastructure/controllers/FindAchievementByIdController";
import { UpdateArchivementController } from "../../context/achievements/infrastructure/controllers/UpdateAchievementController";
import { DeleteArchivementController } from "../../context/achievements/infrastructure/controllers/DeleteAchievementController";

export default function registerArchivementDependencies(container: ContainerBuilder) {
	// REPOSITORY
	container.register("ArchivementRepository", FireBaseArchivementRepository);

	// ARCHIVEMENT USE CASES
	container
		.register("CreateArchivementUseCase", CreateArchivementUseCase)
		.addArgument(new Reference("ArchivementRepository"));

	container
		.register("FindAllArchivementUseCase", FindAllArchivementUseCase)
		.addArgument(new Reference("ArchivementRepository"));

	container
		.register("FindArchivementByIdUseCase", FindArchivementByIdUseCase)
		.addArgument(new Reference("ArchivementRepository"));

	container
		.register("UpdateArchivementUseCase", UpdateArchivementUseCase)	
		.addArgument(new Reference("ArchivementRepository"));

	container
		.register("DeleteArchivementUseCase", DeleteArchivementUseCase)
		.addArgument(new Reference("ArchivementRepository"));


	// Controllers
	container
		.register("CreateArchivementController", CreateArchivementController)	
		.addArgument(new Reference("CreateArchivementUseCase"));

	container
		.register("FindAllArchivementController", FindAllArchivementController)
		.addArgument(new Reference("FindAllArchivementUseCase"));

	container
		.register("FindArchivementByIdController", FindArchivementByIdController)
		.addArgument(new Reference("FindArchivementByIdUseCase"));

	container
		.register("UpdateArchivementController", UpdateArchivementController)
		.addArgument(new Reference("UpdateArchivementUseCase"));

	container
		.register("DeleteArchivementController", DeleteArchivementController)
		.addArgument(new Reference("DeleteArchivementUseCase"));

	return container;
}
