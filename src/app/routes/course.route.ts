import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { FindCourseByIdController } from "../../context/courses/infrastructure/controllers/courses/FindCourseByIdController";
import { FindAllCoursesController } from "../../context/courses/infrastructure/controllers/courses/FindAllCoursesController";

export const register = async (app: Express, container: ContainerBuilder) => {
  const findCourseByIdController = container.get<FindCourseByIdController>("FindCourseByIdController");
  const findAllCoursesController = container.get<FindAllCoursesController>("FindAllCoursesController");

  // ========================================
  // COURSES API - READ ONLY (Student App)
  // ========================================
  // Nota: Este backend es solo para la app móvil de estudiantes.
  // NO hay endpoints de creación/edición/eliminación de cursos.
  // El contenido se gestiona desde Firebase Console o scripts de migración.

  app.get("/courses", (req, res) => findAllCoursesController.run(req, res));
  app.get("/courses/:id", (req, res) => findCourseByIdController.run(req, res));
};
