import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FireBaseAchievementRepository } from "../../context/achievements/infrastructure/repository/FireBaseAchievementRepository";
import { CreateAchievementUseCase } from "../../context/achievements/application/CreateAchievementUseCase";
import { FindAllAchievementUseCase } from "../../context/achievements/application/FindAllAchievementsUseCase";
import { FindAchievementByIdUseCase } from "../../context/achievements/application/FindAchievementByIdUseCase";
import { UpdateAchievementUseCase } from "../../context/achievements/application/UpdateAchievementUseCase";
import { DeleteAchievementUseCase } from "../../context/achievements/application/DeleteAchievementUseCase";
import { CreateAchievementController } from "../../context/achievements/infrastructure/controllers/CreateAchievementController";
import { FindAllAchievementController } from "../../context/achievements/infrastructure/controllers/FindAllAchievementsController";
import { FindAchievementByIdController } from "../../context/achievements/infrastructure/controllers/FindAchievementByIdController";
import { UpdateAchievementController } from "../../context/achievements/infrastructure/controllers/UpdateAchievementController";
import { DeleteAchievementController } from "../../context/achievements/infrastructure/controllers/DeleteAchievementController";

export default function registerAchievementDependencies(container: ContainerBuilder) {
	// REPOSITORY
	container.register("AchievementRepository", FireBaseAchievementRepository);

	// ACHIEVEMENT USE CASES
	container
		.register("CreateAchievementUseCase", CreateAchievementUseCase)
		.addArgument(new Reference("AchievementRepository"));

	container
		.register("FindAllAchievementUseCase", FindAllAchievementUseCase)
		.addArgument(new Reference("AchievementRepository"));

	container
		.register("FindAchievementByIdUseCase", FindAchievementByIdUseCase)
		.addArgument(new Reference("AchievementRepository"));

	container
		.register("UpdateAchievementUseCase", UpdateAchievementUseCase)
		.addArgument(new Reference("AchievementRepository"));

	container
		.register("DeleteAchievementUseCase", DeleteAchievementUseCase)
		.addArgument(new Reference("AchievementRepository"));


	// Controllers
	container
		.register("CreateAchievementController", CreateAchievementController)	
		.addArgument(new Reference("CreateAchievementUseCase"));

	container
		.register("FindAllAchievementController", FindAllAchievementController)
		.addArgument(new Reference("FindAllAchievementUseCase"));

	container
		.register("FindAchievementByIdController", FindAchievementByIdController)
		.addArgument(new Reference("FindAchievementByIdUseCase"));

	container
		.register("UpdateAchievementController", UpdateAchievementController)
		.addArgument(new Reference("UpdateAchievementUseCase"));

	container
		.register("DeleteAchievementController", DeleteAchievementController)
		.addArgument(new Reference("DeleteAchievementUseCase"));

	return container;
}
