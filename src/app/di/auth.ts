import { ContainerBuilder, Reference } from "node-dependency-injection";
import { GenerateTokenUseCase } from "../../context/auth/application/GenerateTokenUseCase";
import { RefreshTokenUseCase } from "../../context/auth/application/RefreshTokenUseCase";
import { GenerateTokenController } from "../../context/auth/infrastructure/controllers/GenerateTokenController";
import { RefreshTokenController } from "../../context/auth/infrastructure/controllers/RefreshTokenController";

export default function registerAuthDependencies(container: ContainerBuilder) {
  // USE CASES
  container.register("GenerateTokenUseCase", GenerateTokenUseCase);
  container.register("RefreshTokenUseCase", RefreshTokenUseCase);

  // CONTROLLERS
  container
    .register("GenerateTokenController", GenerateTokenController)
    .addArgument(new Reference("GenerateTokenUseCase"));

  container
    .register("RefreshTokenController", RefreshTokenController)
    .addArgument(new Reference("RefreshTokenUseCase"));

  return container;
}
