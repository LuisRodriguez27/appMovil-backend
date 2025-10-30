import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindTopicByIdController } from "../../context/topics/infrastructure/controllers/FindTopicByIdController";
import { FindTopicsByCourseController } from "../../context/topics/infrastructure/controllers/FindTopicsByCourseController";
import { FindAllTopicsController } from "../../context/topics/infrastructure/controllers/FindAllTopicsController";
import { CreateTopicController } from "../../context/topics/infrastructure/controllers/CreateTopicController";
import { UpdateTopicController } from "../../context/topics/infrastructure/controllers/UpdateTopicController";
import { DeleteTopicController } from "../../context/topics/infrastructure/controllers/DeleteTopicController";
import { AddSubtopicController } from "../../context/topics/infrastructure/controllers/AddSubtopicController";
import { UpdateSubtopicController } from "../../context/topics/infrastructure/controllers/UpdateSubtopicController";
import { DeleteSubtopicController } from "../../context/topics/infrastructure/controllers/DeleteSubtopicController";
import { FindSubtopicByIdController } from "../../context/topics/infrastructure/controllers/FindSubtopicByIdController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  const findTopicByIdController = container.get<FindTopicByIdController>("FindTopicByIdController");
  const findTopicsByCourseController = container.get<FindTopicsByCourseController>("FindTopicsByCourseController");
  const findAllTopicsController = container.get<FindAllTopicsController>("FindAllTopicsController");
  const createTopicController = container.get<CreateTopicController>("CreateTopicController");
  const updateTopicController = container.get<UpdateTopicController>("UpdateTopicController");
  const deleteTopicController = container.get<DeleteTopicController>("DeleteTopicController");
  const addSubtopicController = container.get<AddSubtopicController>("AddSubtopicController");
  const updateSubtopicController = container.get<UpdateSubtopicController>("UpdateSubtopicController");
  const deleteSubtopicController = container.get<DeleteSubtopicController>("DeleteSubtopicController");
  const findSubtopicByIdController = container.get<FindSubtopicByIdController>("FindSubtopicByIdController");
  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

  // Topic endpoints
  app.get("/topics", authMiddleware, requireRole(['student', 'admin']), (req, res) => findAllTopicsController.run(req, res));

  app.get("/topics/:id", authMiddleware, requireRole(['student', 'admin']), (req, res) => findTopicByIdController.run(req, res));

  app.get("/courses/:courseId/topics", authMiddleware, requireRole(['student', 'admin']), (req, res) => findTopicsByCourseController.run(req, res));

  app.post("/topics", authMiddleware, requireRole(['admin']), (req, res) => createTopicController.run(req, res));

  app.put("/topics/:id", authMiddleware, requireRole(['admin']), (req, res) => updateTopicController.run(req, res));

  app.delete("/topics/:id", authMiddleware, requireRole(['admin']), (req, res) => deleteTopicController.run(req, res));

  // Subtopic endpoints
  app.post("/topics/:topicId/subtopics", authMiddleware, requireRole(['admin']), (req, res) => addSubtopicController.run(req, res));

  app.get("/topics/:topicId/subtopics/:subtopicId", authMiddleware, requireRole(['student', 'admin']), (req, res) => findSubtopicByIdController.run(req, res));

  app.put("/topics/:topicId/subtopics/:subtopicId", authMiddleware, requireRole(['admin']), (req, res) => updateSubtopicController.run(req, res));

  app.delete("/topics/:topicId/subtopics/:subtopicId", authMiddleware, requireRole(['admin']), (req, res) => deleteSubtopicController.run(req, res));
};
