import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { GenerateTokenController } from "../../context/auth/infrastructure/controllers/GenerateTokenController";
import { RefreshTokenController } from "../../context/auth/infrastructure/controllers/RefreshTokenController";

/**
 * Rutas de autenticación auxiliares
 * Estos endpoints facilitan el manejo de tokens para testing
 */
export const register = async (app: Express, container: ContainerBuilder) => {
  const generateTokenController = container.get<GenerateTokenController>("GenerateTokenController");
  const refreshTokenController = container.get<RefreshTokenController>("RefreshTokenController");

  app.post("/auth/generate-token", (req, res) => generateTokenController.run(req, res));
  app.post("/auth/refresh", (req, res) => refreshTokenController.run(req, res));
};
