import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { CreateUserController } from "../../context/users/infrastructure/controllers/CreateUserController";
import { FindUserByIdController } from "../../context/users/infrastructure/controllers/FindUserByIdController";
import { FindAllUsersController } from "../../context/users/infrastructure/controllers/FindAllUsersController";
import { UpdateUserController } from "../../context/users/infrastructure/controllers/UpdateUserController";
import { DeleteUserController } from "../../context/users/infrastructure/controllers/DeleteUserController";
import { UpdateUserXPController } from "../../context/users/infrastructure/controllers/UpdateUserXPController";
import { EnrollUserInCourseController } from "../../context/users/infrastructure/controllers/EnrollUserInCourseController";
import { AdminUserController } from "../../context/users/infrastructure/controllers/AdminUserController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole, requireOwnershipOrAdmin } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  const createUserController = container.get<CreateUserController>("CreateUserController");
  const findUserByIdController = container.get<FindUserByIdController>("FindUserByIdController");
  const findAllUsersController = container.get<FindAllUsersController>("FindAllUsersController");
  const updateUserController = container.get<UpdateUserController>("UpdateUserController");
  const deleteUserController = container.get<DeleteUserController>("DeleteUserController");
  const updateUserXPController = container.get<UpdateUserXPController>("UpdateUserXPController");
  const enrollUserInCourseController = container.get<EnrollUserInCourseController>("EnrollUserInCourseController");
  const adminUserController = container.get<AdminUserController>("AdminUserController");
  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

  app.post('/users', createUserController.run.bind(createUserController));
  app.get('/users', authMiddleware, requireRole(['admin']), findAllUsersController.run.bind(findAllUsersController));
  app.get('/users/:id', authMiddleware, requireOwnershipOrAdmin, findUserByIdController.run.bind(findUserByIdController));
  app.put('/users/:id', authMiddleware, requireOwnershipOrAdmin, updateUserController.run.bind(updateUserController));
  app.delete('/users/:id', authMiddleware, requireRole(['admin']), deleteUserController.run.bind(deleteUserController));
  app.patch('/users/:id/xp', authMiddleware, requireOwnershipOrAdmin, updateUserXPController.run.bind(updateUserXPController));
  app.post('/users/:userId/enroll', authMiddleware, requireRole(['admin']), enrollUserInCourseController.run.bind(enrollUserInCourseController));
  app.get('/admin/students-progress', authMiddleware, requireRole(['admin']), adminUserController.getStudentProgress.bind(adminUserController));
};
