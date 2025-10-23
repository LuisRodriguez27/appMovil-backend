import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FireBaseArchivementRepository } from "../../context/archivements/infrastructure/repository/FireBaseArchivementRepository";
import { CreateArchivementUseCase } from "../../context/archivements/application/CreateArchivementUseCase";
import { FindAllArchivementUseCase } from "../../context/archivements/application/FindAllArchivementUseCase";
import { FindArchivementByIdUseCase } from "../../context/archivements/application/FindArchivementByIdUseCase";
import { UpdateArchivementUseCase } from "../../context/archivements/application/UpdateArchivementUseCase";
import { DeleteArchivementUseCase } from "../../context/archivements/application/DeleteArchivementUseCase";
import { CreateArchivementController } from "../../context/archivements/infrastructure/controllers/CreateArchivementController";
import { FindAllArchivementController } from "../../context/archivements/infrastructure/controllers/FindAllArchivementController";
import { FindArchivementByIdController } from "../../context/archivements/infrastructure/controllers/FindArchivementsByIdController";
import { UpdateArchivementController } from "../../context/archivements/infrastructure/controllers/UpdateArchivementController";
import { DeleteArchivementController } from "../../context/archivements/infrastructure/controllers/DeleteArchivementController";

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
