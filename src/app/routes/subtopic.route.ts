import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateSubtopicController } from "../../context/subtopics/infrastructure/controllers/CreateSubtopicController";
import { requireRole, verifyFirebaseToken } from "../middleware/auth.middleware";
import { UserRepository } from "../../context/users/domain/UserRepository";

export const register = async (app: Express, container: ContainerBuilder) => {
	const createSubtopicController = container.get<CreateSubtopicController>("CreateSubtopicController");
	const userRepository = container.get<UserRepository>("UserRepository");
	const authMiddleware = verifyFirebaseToken(userRepository);

	app.post("/subtopics", authMiddleware, requireRole(['student', 'admin']), (req, res) => createSubtopicController.run(req, res));
}