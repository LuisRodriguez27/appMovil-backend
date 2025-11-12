import { ContainerBuilder, Reference } from "node-dependency-injection";
import { GenerateTokenUseCase } from "../../context/auth/application/GenerateTokenUseCase";
import { RefreshTokenUseCase } from "../../context/auth/application/RefreshTokenUseCase";
import { GoogleAuthUseCase } from "../../context/auth/application/GoogleAuthUseCase";
import { CompleteOnboardingUseCase } from "../../context/auth/application/CompleteOnboardingUseCase";
import { GenerateTokenController } from "../../context/auth/infrastructure/controllers/GenerateTokenController";
import { RefreshTokenController } from "../../context/auth/infrastructure/controllers/RefreshTokenController";
import { GoogleAuthController } from "../../context/auth/infrastructure/controllers/GoogleAuthController";
import { CompleteOnboardingController } from "../../context/auth/infrastructure/controllers/CompleteOnboardingController";

export default function registerAuthDependencies(container: ContainerBuilder) {
  // USE CASES
  container.register("GenerateTokenUseCase", GenerateTokenUseCase);
  container.register("RefreshTokenUseCase", RefreshTokenUseCase);
  container
    .register("GoogleAuthUseCase", GoogleAuthUseCase)
    .addArgument(new Reference("UserRepository"));

  container
    .register("CompleteOnboardingUseCase", CompleteOnboardingUseCase)
    .addArgument(new Reference("UserRepository"))
    .addArgument(new Reference("CourseRepository"));

  // CONTROLLERS
  container
    .register("GenerateTokenController", GenerateTokenController)
    .addArgument(new Reference("GenerateTokenUseCase"));

  container
    .register("RefreshTokenController", RefreshTokenController)
    .addArgument(new Reference("RefreshTokenUseCase"));

  container
    .register("GoogleAuthController", GoogleAuthController)
    .addArgument(new Reference("GoogleAuthUseCase"));

  container
    .register("CompleteOnboardingController", CompleteOnboardingController)
    .addArgument(new Reference("CompleteOnboardingUseCase"));

  return container;
}
