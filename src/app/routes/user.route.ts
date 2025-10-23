import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateUserController } from "../../context/users/infrastructure/controllers/CreateUserController";
import { FindUserByIdController } from "../../context/users/infrastructure/controllers/FindUserByIdController";
import { FindAllUsersController } from "../../context/users/infrastructure/controllers/FindAllUsersController";
import { UpdateUserController } from "../../context/users/infrastructure/controllers/UpdateUserController";
import { DeleteUserController } from "../../context/users/infrastructure/controllers/DeleteUserController";
import { UpdateUserXPController } from "../../context/users/infrastructure/controllers/UpdateUserXPController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole, requireOwnershipOrAdmin } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  const createUserController = container.get<CreateUserController>("CreateUserController");
  const findUserByIdController = container.get<FindUserByIdController>("FindUserByIdController");
  const findAllUsersController = container.get<FindAllUsersController>("FindAllUsersController");
  const updateUserController = container.get<UpdateUserController>("UpdateUserController");
  const deleteUserController = container.get<DeleteUserController>("DeleteUserController");
  const updateUserXPController = container.get<UpdateUserXPController>("UpdateUserXPController");
  const userRepository = container.get<UserRepository>("UserRepository");

  // Crear middleware con dependencia de UserRepository
  const authMiddleware = verifyFirebaseToken(userRepository);

  // Rutas de usuarios
  // POST /users - Crear usuario (público, se usa cuando Firebase Auth crea el usuario)
  app.post('/users', createUserController.run.bind(createUserController));

  // GET /users - Solo admins pueden ver todos los usuarios
  app.get('/users', authMiddleware, requireRole(['admin']), findAllUsersController.run.bind(findAllUsersController));

  // GET /users/:id - Estudiantes pueden ver su propio perfil, admins pueden ver cualquiera
  app.get('/users/:id', authMiddleware, requireOwnershipOrAdmin, findUserByIdController.run.bind(findUserByIdController));

  // PUT /users/:id - Solo el dueño o admin puede actualizar
  app.put('/users/:id', authMiddleware, requireOwnershipOrAdmin, updateUserController.run.bind(updateUserController));

  // DELETE /users/:id - Solo admins pueden eliminar usuarios
  app.delete('/users/:id', authMiddleware, requireRole(['admin']), deleteUserController.run.bind(deleteUserController));

  // PATCH /users/:id/xp - Solo el dueño o admin puede actualizar XP
  app.patch('/users/:id/xp', authMiddleware, requireOwnershipOrAdmin, updateUserXPController.run.bind(updateUserXPController));
};
