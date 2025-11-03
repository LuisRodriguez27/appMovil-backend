import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindAllAchievementController } from "../../context/achievements/infrastructure/controllers/FindAllAchievementsController";
import { FindAchievementByIdController } from "../../context/achievements/infrastructure/controllers/FindAchievementByIdController";
import { CreateAchievementController } from "../../context/achievements/infrastructure/controllers/CreateAchievementController";
import { UpdateAchievementController } from "../../context/achievements/infrastructure/controllers/UpdateAchievementController";
import { DeleteAchievementController } from "../../context/achievements/infrastructure/controllers/DeleteAchievementController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";
import { FindAchievementsByRarityController } from "../../context/achievements/infrastructure/controllers/FindAchievementsByRarityController";

export const register = async (app: Express, container: ContainerBuilder) => {
	const findAllAchievementController = container.get<FindAllAchievementController>("FindAllAchievementController");
	const findAchievementByIdController = container.get<FindAchievementByIdController>("FindAchievementByIdController");
	const createAchievementController = container.get<CreateAchievementController>("CreateAchievementController");
	const updateAchievementController = container.get<UpdateAchievementController>("UpdateAchievementController");
	const deleteAchievementController = container.get<DeleteAchievementController>("DeleteAchievementController");
	const findAchievementsByRarityController = container.get<FindAchievementsByRarityController>("FindAchievementsByRarityController");

	const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

	// ADMIN
	app.post("/achievements", authMiddleware, requireRole(['admin']), (req, res) => createAchievementController.run(req, res));
	app.put("/achievements/:id", authMiddleware, requireRole(['admin']), (req, res) => updateAchievementController.run(req, res));
	app.delete("/achievements/:id", authMiddleware, requireRole(['admin']), (req, res) => deleteAchievementController.run(req, res));

	// STUDENT & ADMIN
	app.get("/achievements", authMiddleware, requireRole(['student', 'admin']), (req, res) => findAllAchievementController.run(req, res));
	app.get("/achievements/:id", authMiddleware, requireRole(['student', 'admin']), (req, res) => findAchievementByIdController.run(req, res));
	app.get("/achievements/rarity/:rarity", authMiddleware, requireRole(['student', 'admin']), (req, res) => findAchievementsByRarityController.run(req, res));

};