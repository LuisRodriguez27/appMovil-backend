import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindTopicByIdController } from "../../context/topics/infrastructure/controllers/topics/FindTopicByIdController";
import { FindTopicsByCourseController } from "../../context/topics/infrastructure/controllers/topics/FindTopicsByCourseController";
import { CreateTopicController } from "../../context/topics/infrastructure/controllers/CreateTopicController";
import { UpdateTopicController } from "../../context/topics/infrastructure/controllers/UpdateTopicController";
import { DeleteTopicController } from "../../context/topics/infrastructure/controllers/DeleteTopicController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  // Controllers - Students
  const findTopicByIdController = container.get<FindTopicByIdController>("FindTopicByIdController");
  const findTopicsByCourseController = container.get<FindTopicsByCourseController>("FindTopicsByCourseController");

  // Controllers - Admin
  const createTopicController = container.get<CreateTopicController>("CreateTopicController");
  const updateTopicController = container.get<UpdateTopicController>("UpdateTopicController");
  const deleteTopicController = container.get<DeleteTopicController>("DeleteTopicController");

  const userRepository = container.get<UserRepository>("UserRepository");

  // Crear middleware con dependencia de UserRepository
  const authMiddleware = verifyFirebaseToken(userRepository);

  // ========================================
  // TOPICS API - STUDENTS (READ ONLY)
  // ========================================

  // GET /topics/:id - Todos los usuarios autenticados pueden ver un tema específico
  app.get("/topics/:id", authMiddleware, requireRole(['student', 'admin']), (req, res) => findTopicByIdController.run(req, res));

  // GET /courses/:courseId/topics - Todos los usuarios autenticados pueden ver los temas de un curso
  app.get("/courses/:courseId/topics", authMiddleware, requireRole(['student', 'admin']), (req, res) => findTopicsByCourseController.run(req, res));

  // ========================================
  // TOPICS API - ADMIN (CRUD)
  // ========================================

  // POST /topics - Solo admins pueden crear temas
  app.post("/topics", authMiddleware, requireRole(['admin']), (req, res) => createTopicController.run(req, res));

  // PUT /topics/:id - Solo admins pueden actualizar temas
  app.put("/topics/:id", authMiddleware, requireRole(['admin']), (req, res) => updateTopicController.run(req, res));

  // DELETE /topics/:id - Solo admins pueden eliminar temas
  app.delete("/topics/:id", authMiddleware, requireRole(['admin']), (req, res) => deleteTopicController.run(req, res));
};
