import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateCourseController } from "../../context/courses/infrastructure/controllers/CreateCourseController";
import { FindCourseByIdController } from "../../context/courses/infrastructure/controllers/FindCourseByIdController";
import { FindAllCoursesController } from "../../context/courses/infrastructure/controllers/FindAllCoursesController";
import { UpdateCourseController } from "../../context/courses/infrastructure/controllers/UpdateCourseController";
import { DeleteCourseController } from "../../context/courses/infrastructure/controllers/DeleteCourseController";

export const register = async (app: Express, container: ContainerBuilder) => {
  const createCourseController = container.get<CreateCourseController>("CreateCourseController");
  const findCourseByIdController = container.get<FindCourseByIdController>("FindCourseByIdController");
  const findAllCoursesController = container.get<FindAllCoursesController>("FindAllCoursesController");
  const updateCourseController = container.get<UpdateCourseController>("UpdateCourseController");
  const deleteCourseController = container.get<DeleteCourseController>("DeleteCourseController");

  app.post("/courses", (req, res) => createCourseController.run(req, res));
  app.get("/courses/:id", (req, res) => findCourseByIdController.run(req, res));
  app.get("/courses", (req, res) => findAllCoursesController.run(req, res));
  app.put("/courses/:id", (req, res) => updateCourseController.run(req, res));
  app.delete("/courses/:id", (req, res) => deleteCourseController.run(req, res)); 
};