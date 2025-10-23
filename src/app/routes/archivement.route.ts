import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindAllArchivementController } from "../../context/archivements/infrastructure/controllers/FindAllArchivementController";
import { FindArchivementByIdController } from "../../context/archivements/infrastructure/controllers/FindArchivementsByIdController";
import { CreateArchivementController } from "../../context/archivements/infrastructure/controllers/CreateArchivementController";
import { UpdateArchivementController } from "../../context/archivements/infrastructure/controllers/UpdateArchivementController";
import { DeleteArchivementController } from "../../context/archivements/infrastructure/controllers/DeleteArchivementController";

export const register = async (app: Express, container: ContainerBuilder) => {
	const findAllArchivementController = container.get<FindAllArchivementController>("FindAllArchivementController");
	const findArchivementByIdController = container.get<FindArchivementByIdController>("FindArchivementByIdController");
	const createArchivementController = container.get<CreateArchivementController>("CreateArchivementController");
	const updateArchivementController = container.get<UpdateArchivementController>("UpdateArchivementController");
	const deleteArchivementController = container.get<DeleteArchivementController>("DeleteArchivementController");

	app.get("/archivements", (req, res) => findAllArchivementController.run(req, res));
	app.get("/archivements/:id", (req, res) => findArchivementByIdController.run(req, res));
	app.post("/archivements", (req, res) => createArchivementController.run(req, res));
	app.put("/archivements/:id", (req, res) => updateArchivementController.run(req, res));
	app.delete("/archivements/:id", (req, res) => deleteArchivementController.run(req, res));
};