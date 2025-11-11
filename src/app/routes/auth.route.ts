import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { GenerateTokenController } from "../../context/auth/infrastructure/controllers/GenerateTokenController";
import { RefreshTokenController } from "../../context/auth/infrastructure/controllers/RefreshTokenController";
import { GoogleAuthController } from "../../context/auth/infrastructure/controllers/GoogleAuthController";

export const register = async (app: Express, container: ContainerBuilder) => {
  const generateTokenController = container.get<GenerateTokenController>("GenerateTokenController");
  const refreshTokenController = container.get<RefreshTokenController>("RefreshTokenController");
  const googleAuthController = container.get<GoogleAuthController>("GoogleAuthController");

  // Endpoints de desarrollo (para testing)
  app.post("/auth/generate-token", (req, res) => generateTokenController.run(req, res));
  app.post("/auth/refresh", (req, res) => refreshTokenController.run(req, res));

  // Endpoint de producción (autenticación con Google)
  app.post("/auth/google", (req, res) => googleAuthController.run(req, res));
};
