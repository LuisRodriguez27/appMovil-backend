import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateLessonController } from "../../context/lessons/infrastructure/controllers/CreateLessonController";
import { UpdateLessonController } from "../../context/lessons/infrastructure/controllers/UpdateLessonController";
import { DeleteLessonController } from "../../context/lessons/infrastructure/controllers/DeleteLessonController";
import { FindLessonByIdController } from "../../context/lessons/infrastructure/controllers/FindLessonByIdController";
import { FindLessonsByTopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsByTopicController";
import { FindLessonsBySubtopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsBySubtopicController";
import { FindAllLessonsController } from "../../context/lessons/infrastructure/controllers/FindAllLessonsController";
import { GroupLessonsByExerciseTypeController } from "../../context/lessons/infrastructure/controllers/GroupLessonsByExerciseTypeController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  const createLessonController = container.get<CreateLessonController>("CreateLessonController");
  const updateLessonController = container.get<UpdateLessonController>("UpdateLessonController");
  const deleteLessonController = container.get<DeleteLessonController>("DeleteLessonController");
  const findLessonByIdController = container.get<FindLessonByIdController>("FindLessonByIdController");
  const findLessonsByTopicController = container.get<FindLessonsByTopicController>("FindLessonsByTopicController");
  const findLessonsBySubtopicController = container.get<FindLessonsBySubtopicController>("FindLessonsBySubtopicController");
  const findAllLessonsController = container.get<FindAllLessonsController>("FindAllLessonsController");
  const groupLessonsByExerciseTypeController = container.get<GroupLessonsByExerciseTypeController>("GroupLessonsByExerciseTypeController");

  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);
  
  app.post('/lessons', authMiddleware, requireRole(['admin']), (req, res) => createLessonController.run(req, res));

  app.put('/lessons/:id', authMiddleware, requireRole(['admin']), (req, res) => updateLessonController.run(req, res));

  app.delete('/lessons/:id', authMiddleware, requireRole(['admin']), (req, res) => deleteLessonController.run(req, res));

  app.get('/lessons', authMiddleware, requireRole(['student', 'admin']), (req, res) => findAllLessonsController.run(req, res));

  app.get('/lessons/grouped/by-exercise-type', authMiddleware, requireRole(['student', 'admin']), (req, res) => groupLessonsByExerciseTypeController.run(req, res));

  app.get('/lessons/:id', authMiddleware, requireRole(['student', 'admin']), (req, res) => findLessonByIdController.run(req, res));

  app.get('/topics/:topicId/lessons', authMiddleware, requireRole(['student', 'admin']), (req, res) => findLessonsByTopicController.run(req, res));

  app.get('/topics/:topicId/subtopics/:subtopicId/lessons', authMiddleware, requireRole(['student', 'admin']), (req, res) => findLessonsBySubtopicController.run(req, res));
};
