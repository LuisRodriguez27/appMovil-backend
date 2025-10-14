import { ContainerBuilder, Reference } from "node-dependency-injection";
import { FirebaseUserRepository } from "../../context/users/infrastructure/repository/FirebaseUserRepository";
import { CreateUserUseCase } from "../../context/users/application/CreateUserUseCase";
import { FindUserByIdUseCase } from "../../context/users/application/FindUserByIdUseCase";
import { FindAllUsersUseCase } from "../../context/users/application/FindAllUsersUseCase";
import { UpdateUserUseCase } from "../../context/users/application/UpdateUserUseCase";
import { DeleteUserUseCase } from "../../context/users/application/DeleteUserUseCase";
import { UpdateUserXPUseCase } from "../../context/users/application/UpdateUserXPUseCase";
import { CreateUserController } from "../../context/users/infrastructure/controllers/CreateUserController";
import { FindUserByIdController } from "../../context/users/infrastructure/controllers/FindUserByIdController";
import { FindAllUsersController } from "../../context/users/infrastructure/controllers/FindAllUsersController";
import { UpdateUserController } from "../../context/users/infrastructure/controllers/UpdateUserController";
import { DeleteUserController } from "../../context/users/infrastructure/controllers/DeleteUserController";
import { UpdateUserXPController } from "../../context/users/infrastructure/controllers/UpdateUserXPController";

export default function registerUsersDependencies(container: ContainerBuilder) {
  // Repository
  container.register("UserRepository", FirebaseUserRepository);

  // Use Cases
  container
    .register("CreateUserUseCase", CreateUserUseCase)
    .addArgument(new Reference("UserRepository"));

  container
    .register("FindUserByIdUseCase", FindUserByIdUseCase)
    .addArgument(new Reference("UserRepository"));

  container
    .register("FindAllUsersUseCase", FindAllUsersUseCase)
    .addArgument(new Reference("UserRepository"));

  container
    .register("UpdateUserUseCase", UpdateUserUseCase)
    .addArgument(new Reference("UserRepository"));

  container
    .register("DeleteUserUseCase", DeleteUserUseCase)
    .addArgument(new Reference("UserRepository"));

  container
    .register("UpdateUserXPUseCase", UpdateUserXPUseCase)
    .addArgument(new Reference("UserRepository"));

  // Controllers
  container
    .register("CreateUserController", CreateUserController)
    .addArgument(new Reference("CreateUserUseCase"));

  container
    .register("FindUserByIdController", FindUserByIdController)
    .addArgument(new Reference("FindUserByIdUseCase"));

  container
    .register("FindAllUsersController", FindAllUsersController)
    .addArgument(new Reference("FindAllUsersUseCase"));

  container
    .register("UpdateUserController", UpdateUserController)
    .addArgument(new Reference("UpdateUserUseCase"));

  container
    .register("DeleteUserController", DeleteUserController)
    .addArgument(new Reference("DeleteUserUseCase"));

  container
    .register("UpdateUserXPController", UpdateUserXPController)
    .addArgument(new Reference("UpdateUserXPUseCase"));

  return container;
}
