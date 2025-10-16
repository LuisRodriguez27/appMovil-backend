import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindTopicByIdController } from "../../context/topics/infrastructure/controllers/topics/FindTopicByIdController";
import { FindTopicsByCourseController } from "../../context/topics/infrastructure/controllers/topics/FindTopicsByCourseController";

export const register = async (app: Express, container: ContainerBuilder) => {
  const findTopicByIdController = container.get<FindTopicByIdController>("FindTopicByIdController");
  const findTopicsByCourseController = container.get<FindTopicsByCourseController>("FindTopicsByCourseController");

  // ========================================
  // TOPICS API - READ ONLY (Student App)
  // ========================================
  // Nota: Los temas se gestionan desde Firebase Console o scripts.
  // Los subtemas están embebidos en topics.subtopics[]

  app.get("/topics/:id", (req, res) => findTopicByIdController.run(req, res));
  app.get("/courses/:courseId/topics", (req, res) => findTopicsByCourseController.run(req, res));
};
