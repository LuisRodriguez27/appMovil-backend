import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindCourseByIdController } from "../../context/courses/infrastructure/controllers/FindCourseByIdController";
import { FindAllCoursesController } from "../../context/courses/infrastructure/controllers/FindAllCoursesController";
import { CreateCourseController } from "../../context/courses/infrastructure/controllers/CreateCourseController";
import { UpdateCourseController } from "../../context/courses/infrastructure/controllers/UpdateCourseController";
import { DeleteCourseController } from "../../context/courses/infrastructure/controllers/DeleteCourseController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  // Controllers - Students
  const findCourseByIdController = container.get<FindCourseByIdController>("FindCourseByIdController");
  const findAllCoursesController = container.get<FindAllCoursesController>("FindAllCoursesController");

  // Controllers - Admin
  const createCourseController = container.get<CreateCourseController>("CreateCourseController");
  const updateCourseController = container.get<UpdateCourseController>("UpdateCourseController");
  const deleteCourseController = container.get<DeleteCourseController>("DeleteCourseController");

  const userRepository = container.get<UserRepository>("UserRepository");

  // Crear middleware con dependencia de UserRepository
  const authMiddleware = verifyFirebaseToken(userRepository);

  // ========================================
  // COURSES API - STUDENTS (READ ONLY)
  // ========================================

  // GET /courses - Todos los usuarios autenticados pueden ver cursos
  app.get("/courses", authMiddleware, requireRole(['student', 'admin']), (req, res) => findAllCoursesController.run(req, res));

  // GET /courses/:id - Todos los usuarios autenticados pueden ver un curso específico
  app.get("/courses/:id", authMiddleware, requireRole(['student', 'admin']), (req, res) => findCourseByIdController.run(req, res));

  // ========================================
  // COURSES API - ADMIN (CRUD)
  // ========================================

  // POST /courses - Solo admins pueden crear cursos
  app.post("/courses", authMiddleware, requireRole(['admin']), (req, res) => createCourseController.run(req, res));

  // PUT /courses/:id - Solo admins pueden actualizar cursos
  app.put("/courses/:id", authMiddleware, requireRole(['admin']), (req, res) => updateCourseController.run(req, res));

  // DELETE /courses/:id - Solo admins pueden eliminar cursos
  app.delete("/courses/:id", authMiddleware, requireRole(['admin']), (req, res) => deleteCourseController.run(req, res));
};
