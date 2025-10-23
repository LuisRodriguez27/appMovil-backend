import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindAllArchivementController } from "../../context/achievements/infrastructure/controllers/FindAllAchievementsController";
import { FindArchivementByIdController } from "../../context/achievements/infrastructure/controllers/FindAchievementByIdController";
import { CreateArchivementController } from "../../context/achievements/infrastructure/controllers/CreateAchievementController";
import { UpdateArchivementController } from "../../context/achievements/infrastructure/controllers/UpdateAchievementController";
import { DeleteArchivementController } from "../../context/achievements/infrastructure/controllers/DeleteAchievementController";

export const register = async (app: Express, container: ContainerBuilder) => {
	const findAllArchivementController = container.get<FindAllArchivementController>("FindAllArchivementController");
	const findArchivementByIdController = container.get<FindArchivementByIdController>("FindArchivementByIdController");
	const createArchivementController = container.get<CreateArchivementController>("CreateArchivementController");
	const updateArchivementController = container.get<UpdateArchivementController>("UpdateArchivementController");
	const deleteArchivementController = container.get<DeleteArchivementController>("DeleteArchivementController");

	app.get("/achievements", (req, res) => findAllArchivementController.run(req, res));
	app.get("/achievements/:id", (req, res) => findArchivementByIdController.run(req, res));
	app.post("/achievements", (req, res) => createArchivementController.run(req, res));
	app.put("/achievements/:id", (req, res) => updateArchivementController.run(req, res));
	app.delete("/achievements/:id", (req, res) => deleteArchivementController.run(req, res));
};