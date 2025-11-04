import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateSubtopicController } from "../../context/subtopics/infrastructure/controllers/CreateSubtopicController";
import { FindAllSubtopicsController } from "../../context/subtopics/infrastructure/controllers/FindAllSubtopicsController";

import { requireRole, verifyFirebaseToken } from "../middleware/auth.middleware";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { FindSubtopicByIdController } from "../../context/subtopics/infrastructure/controllers/FindSubtopicByIdController";
import { FindSubtopicByTopicIdController } from "../../context/subtopics/infrastructure/controllers/FindSubtopicByTopicIdController";
import { DeleteSubtopicController } from "../../context/subtopics/infrastructure/controllers/DeleteSubtopicController";

export const register = async (app: Express, container: ContainerBuilder) => {
	const createSubtopicController = container.get<CreateSubtopicController>("CreateSubtopicController");
	const findAllSubtopicsController = container.get<FindAllSubtopicsController>("FindAllSubtopicsController");
	const findSubtopicByIdController = container.get<FindSubtopicByIdController>("FindSubtopicByIdController");
	const findSubtopicsByTopicIdController = container.get<FindSubtopicByTopicIdController>("FindSubtopicsByTopicIdController");
	const deleteSubtopicController = container.get<DeleteSubtopicController>("DeleteSubtopicController");
	
	const userRepository = container.get<UserRepository>("UserRepository");
	const authMiddleware = verifyFirebaseToken(userRepository);

	app.post("/subtopics", authMiddleware, requireRole(['admin']), (req, res) => createSubtopicController.run(req, res));
	app.delete("/subtopics/:id", authMiddleware, requireRole(['admin']), (req, res) => deleteSubtopicController.run(req, res));

	app.get("/subtopics", authMiddleware, requireRole(['student', 'admin']), (req, res) => findAllSubtopicsController.run(req, res));
	app.get("/subtopics/:id", authMiddleware, requireRole(['student', 'admin']), (req, res) => findSubtopicByIdController.run(req, res));
	app.get("/topics/:topicId/subtopics", authMiddleware, requireRole(['student', 'admin']), (req, res) => findSubtopicsByTopicIdController.run(req, res));
}