import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { GenerateTokenController } from "../../context/auth/infrastructure/controllers/GenerateTokenController";
import { RefreshTokenController } from "../../context/auth/infrastructure/controllers/RefreshTokenController";
import { GoogleAuthController } from "../../context/auth/infrastructure/controllers/GoogleAuthController";
import { CompleteOnboardingController } from "../../context/auth/infrastructure/controllers/CompleteOnboardingController";
import { ValidateAdminAccessController } from "../../context/auth/infrastructure/controllers/ValidateAdminAccessController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  const generateTokenController = container.get<GenerateTokenController>("GenerateTokenController");
  const refreshTokenController = container.get<RefreshTokenController>("RefreshTokenController");
  const googleAuthController = container.get<GoogleAuthController>("GoogleAuthController");
  const completeOnboardingController = container.get<CompleteOnboardingController>("CompleteOnboardingController");
  const validateAdminAccessController = container.get<ValidateAdminAccessController>("ValidateAdminAccessController");

  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

  // Endpoints de desarrollo (para testing)
  app.post("/auth/generate-token", (req, res) => generateTokenController.run(req, res));
  app.post("/auth/refresh", (req, res) => refreshTokenController.run(req, res));

  // Endpoint de producción (autenticación con Google)
  app.post("/auth/google", (req, res) => googleAuthController.run(req, res));

  // Endpoint para completar onboarding de nuevos usuarios
  app.post("/auth/complete-onboarding", (req, res) => completeOnboardingController.run(req, res));

  // Endpoint para validar acceso administrativo
  app.get("/auth/validate-admin", authMiddleware, (req, res) => validateAdminAccessController.run(req, res));
};
