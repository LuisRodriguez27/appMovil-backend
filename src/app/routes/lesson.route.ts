import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateLessonController } from "../../context/lessons/infrastructure/controllers/CreateLessonController";
import { UpdateLessonController } from "../../context/lessons/infrastructure/controllers/UpdateLessonController";
import { DeleteLessonController } from "../../context/lessons/infrastructure/controllers/DeleteLessonController";
import { FindLessonByIdController } from "../../context/lessons/infrastructure/controllers/FindLessonByIdController";
import { FindLessonsByTopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsByTopicController";
import { FindLessonsBySubtopicController } from "../../context/lessons/infrastructure/controllers/FindLessonsBySubtopicController";
import { CompleteLessonController } from "../../context/lessons/infrastructure/controllers/CompleteLessonController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  // Obtener controladores del contenedor de dependencias
  const createLessonController = container.get<CreateLessonController>("CreateLessonController");
  const updateLessonController = container.get<UpdateLessonController>("UpdateLessonController");
  const deleteLessonController = container.get<DeleteLessonController>("DeleteLessonController");
  const findLessonByIdController = container.get<FindLessonByIdController>("FindLessonByIdController");
  const findLessonsByTopicController = container.get<FindLessonsByTopicController>("FindLessonsByTopicController");
  const findLessonsBySubtopicController = container.get<FindLessonsBySubtopicController>("FindLessonsBySubtopicController");
  const completeLessonController = container.get<CompleteLessonController>("CompleteLessonController");

  // Configurar middleware de autenticación
  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

  // ========================================
  // CRUD - Gestión de Lecciones (SOLO ADMIN)
  // ========================================
  
  app.post('/lessons', 
    authMiddleware, 
    requireRole(['admin']), 
    (req, res) => createLessonController.run(req, res)
  );

  app.put('/lessons/:id', 
    authMiddleware, 
    requireRole(['admin']), 
    (req, res) => updateLessonController.run(req, res)
  );

  app.delete('/lessons/:id', 
    authMiddleware, 
    requireRole(['admin']), 
    (req, res) => deleteLessonController.run(req, res)
  );

  // ========================================
  // READ - Consultas de Lecciones (STUDENT + ADMIN)
  // ========================================
  
  app.get('/lessons/:id', 
    authMiddleware, 
    requireRole(['student', 'admin']), 
    (req, res) => findLessonByIdController.run(req, res)
  );
  
  app.get('/topics/:topicId/lessons', 
    authMiddleware, 
    requireRole(['student', 'admin']), 
    (req, res) => findLessonsByTopicController.run(req, res)
  );
  
  app.get('/topics/:topicId/subtopics/:subtopicId/lessons', 
    authMiddleware, 
    requireRole(['student', 'admin']), 
    (req, res) => findLessonsBySubtopicController.run(req, res)
  );

  // ========================================
  // STUDENT INTERACTION - Completar Lección (STUDENT + ADMIN)
  // ========================================
  
  app.post('/lessons/:id/complete', 
    authMiddleware, 
    requireRole(['student', 'admin']), 
    (req, res) => completeLessonController.run(req, res)
  );
};
