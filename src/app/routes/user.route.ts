import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateUserController } from "../../context/users/infrastructure/controllers/CreateUserController";
import { FindUserByIdController } from "../../context/users/infrastructure/controllers/FindUserByIdController";
import { FindAllUsersController } from "../../context/users/infrastructure/controllers/FindAllUsersController";
import { UpdateUserController } from "../../context/users/infrastructure/controllers/UpdateUserController";
import { DeleteUserController } from "../../context/users/infrastructure/controllers/DeleteUserController";
import { UpdateUserXPController } from "../../context/users/infrastructure/controllers/UpdateUserXPController";

export const register = async (app: Express, container: ContainerBuilder) => {
  const createUserController = container.get<CreateUserController>("CreateUserController");
  const findUserByIdController = container.get<FindUserByIdController>("FindUserByIdController");
  const findAllUsersController = container.get<FindAllUsersController>("FindAllUsersController");
  const updateUserController = container.get<UpdateUserController>("UpdateUserController");
  const deleteUserController = container.get<DeleteUserController>("DeleteUserController");
  const updateUserXPController = container.get<UpdateUserXPController>("UpdateUserXPController");

  // Rutas de usuarios
  app.post('/users', createUserController.run.bind(createUserController));
  app.get('/users', findAllUsersController.run.bind(findAllUsersController));
  app.get('/users/:id', findUserByIdController.run.bind(findUserByIdController));
  app.put('/users/:id', updateUserController.run.bind(updateUserController));
  app.delete('/users/:id', deleteUserController.run.bind(deleteUserController));
  app.patch('/users/:id/xp', updateUserXPController.run.bind(updateUserXPController));
};
