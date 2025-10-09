import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateStudentController } from "../../context/students/infrastructure/controllers/CreateStudentController";

export const register = async (app: Express, container: ContainerBuilder) => {
  const create = container.get<CreateStudentController>("CreateStudentController");

  app.post('/students', create.run.bind(create));
}  