import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindAllAchievementController } from "../../context/achievements/infrastructure/controllers/FindAllAchievementsController";
import { FindAchievementByIdController } from "../../context/achievements/infrastructure/controllers/FindAchievementByIdController";
import { CreateAchievementController } from "../../context/achievements/infrastructure/controllers/CreateAchievementController";
import { UpdateAchievementController } from "../../context/achievements/infrastructure/controllers/UpdateAchievementController";
import { DeleteAchievementController } from "../../context/achievements/infrastructure/controllers/DeleteAchievementController";

export const register = async (app: Express, container: ContainerBuilder) => {
	const findAllAchievementController = container.get<FindAllAchievementController>("FindAllAchievementController");
	const findAchievementByIdController = container.get<FindAchievementByIdController>("FindAchievementByIdController");
	const createAchievementController = container.get<CreateAchievementController>("CreateAchievementController");
	const updateAchievementController = container.get<UpdateAchievementController>("UpdateAchievementController");
	const deleteAchievementController = container.get<DeleteAchievementController>("DeleteAchievementController");

	app.get("/achievements", (req, res) => findAllAchievementController.run(req, res));
	app.get("/achievements/:id", (req, res) => findAchievementByIdController.run(req, res));
	app.post("/achievements", (req, res) => createAchievementController.run(req, res));
	app.put("/achievements/:id", (req, res) => updateAchievementController.run(req, res));
	app.delete("/achievements/:id", (req, res) => deleteAchievementController.run(req, res));
};