import { Express, Request, Response } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateLessonController } from "../../context/lessons/infrastructure/controllers/CreateLessonController";
import { UpdateLessonController } from "../../context/lessons/infrastructure/controllers/UpdateLessonController";
import { DeleteLessonController } from "../../context/lessons/infrastructure/controllers/DeleteLessonController";
import { FindLessonByIdController } from "../../context/lessons/infrastructure/controllers/FindLessonByIdController";
import { FindLessonsByTopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsByTopicController";
import { FindLessonsBySubtopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsBySubtopicController";
import { CompleteLessonController } from "../../context/lessons/infrastructure/controllers/CompleteLessonController";
import { verifyFirebaseToken as authMiddleware } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  // Obtener controladores del contenedor de dependencias
  const createLessonController = container.get<CreateLessonController>("CreateLessonController");
  const updateLessonController = container.get<UpdateLessonController>("UpdateLessonController");
  const deleteLessonController = container.get<DeleteLessonController>("DeleteLessonController");
  const findLessonByIdController = container.get<FindLessonByIdController>("FindLessonByIdController");
  const findLessonsByTopicController = container.get<FindLessonsByTopicController>("FindLessonsByTopicController");
  const findLessonsBySubtopicController = container.get<FindLessonsBySubtopicController>("FindLessonsBySubtopicController");
  const completeLessonController = container.get<CompleteLessonController>("CompleteLessonController");

  app.post('/lessons',
    authMiddleware,
    requireRole(['admin']),
    (req: Request, res: Response) => createLessonController.run(req, res)
  );

  app.put('/lessons/:id',
    authMiddleware,
    requireRole(['admin']),
    (req: Request, res: Response) => updateLessonController.run(req, res)
  );

  app.delete('/lessons/:id',
    authMiddleware,
    requireRole(['admin']),
    (req: Request, res: Response) => deleteLessonController.run(req, res)
  );

  app.get('/lessons/:id',
    authMiddleware,
    requireRole(['student', 'admin']),
    (req: Request, res: Response) => findLessonByIdController.run(req, res)
  );

  app.get('/topics/:topicId/lessons',
    authMiddleware,
    requireRole(['student', 'admin']),
    (req: Request, res: Response) => findLessonsByTopicController.run(req, res)
  );

  app.get('/topics/:topicId/subtopics/:subtopicId/lessons',
    authMiddleware,
    requireRole(['student', 'admin']),
    (req: Request, res: Response) => findLessonsBySubtopicController.run(req, res)
  );

  app.post('/lessons/:id/complete',
    authMiddleware,
    requireRole(['student', 'admin']),
    (req: Request, res: Response) => completeLessonController.run(req, res)
  );
};
