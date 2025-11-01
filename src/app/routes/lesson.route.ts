import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateLessonController } from "../../context/lessons/infrastructure/controllers/CreateLessonController";
import { UpdateLessonController } from "../../context/lessons/infrastructure/controllers/UpdateLessonController";
import { DeleteLessonController } from "../../context/lessons/infrastructure/controllers/DeleteLessonController";
import { FindLessonByIdController } from "../../context/lessons/infrastructure/controllers/FindLessonByIdController";
import { FindLessonsByTopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsByTopicController";
import { FindLessonsBySubtopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsBySubtopicController";
import { CompleteLessonController } from "../../context/lessons/infrastructure/controllers/CompleteLessonController";

export const register = async (app: Express, container: ContainerBuilder) => {
  // Obtener controladores del contenedor de dependencias
  const createLessonController = container.get<CreateLessonController>("CreateLessonController");
  const updateLessonController = container.get<UpdateLessonController>("UpdateLessonController");
  const deleteLessonController = container.get<DeleteLessonController>("DeleteLessonController");
  const findLessonByIdController = container.get<FindLessonByIdController>("FindLessonByIdController");
  const findLessonsByTopicController = container.get<FindLessonsByTopicController>("FindLessonsByTopicController");
  const findLessonsBySubtopicController = container.get<FindLessonsBySubtopicController>("FindLessonsBySubtopicController");
  const completeLessonController = container.get<CompleteLessonController>("CompleteLessonController");

  app.post('/lessons', (req, res) => createLessonController.run(req, res));
  app.put('/lessons/:id', (req, res) => updateLessonController.run(req, res));
  app.delete('/lessons/:id', (req, res) => deleteLessonController.run(req, res));

  app.get('/lessons/:id', (req, res) => findLessonByIdController.run(req, res));
  app.get('/topics/:topicId/lessons', (req, res) => findLessonsByTopicController.run(req, res));
  app.get('/topics/:topicId/subtopics/:subtopicId/lessons', (req, res) => findLessonsBySubtopicController.run(req, res));

  // STUDENT INTERACTION - Completar Lección
  app.post('/lessons/:id/complete', (req, res) => completeLessonController.run(req, res));
};
