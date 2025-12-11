import { Express } from "express";
import { ContainerBuilder } from "node-dependency-injection";
import { GenerateExerciseController } from "../../context/exercises/infrastructure/controllers/GenerateExerciseController";
import { GenerateExerciseStreamController } from "../../context/exercises/infrastructure/controllers/GenerateExerciseStreamController";
import { ValidateExerciseController } from "../../context/exercises/infrastructure/controllers/ValidateExerciseController";
import { SubmitExerciseController } from "../../context/exercises/infrastructure/controllers/SubmitExerciseController";
import { GetAttemptStatusController } from "../../context/exercises/infrastructure/controllers/GetAttemptStatusController";
import { EvaluationWebhookController } from "../../context/exercises/infrastructure/controllers/EvaluationWebhookController";
import { UserRepository } from "../../context/users/domain/UserRepository";
import { verifyFirebaseToken, requireRole } from "../middleware/auth.middleware";

export const register = async (app: Express, container: ContainerBuilder) => {
  const generateExerciseController = container.get<GenerateExerciseController>("GenerateExerciseController");
  const validateExerciseController = container.get<ValidateExerciseController>("ValidateExerciseController");
  const submitExerciseController = container.get<SubmitExerciseController>("SubmitExerciseController");
  const getAttemptStatusController = container.get<GetAttemptStatusController>("GetAttemptStatusController");
  const evaluationWebhookController = container.get<EvaluationWebhookController>("EvaluationWebhookController");

  const userRepository = container.get<UserRepository>("UserRepository");
  const authMiddleware = verifyFirebaseToken(userRepository);

  // GET /lessons/:lessonId/exercise - Generar ejercicio para una lección
  app.get('/lessons/:lessonId/exercise', authMiddleware, requireRole(['student', 'admin']), (req, res) => generateExerciseController.run(req, res));

  // GET /lessons/:lessonId/exercise/stream - Generar ejercicios con streaming (SSE)
  const generateExerciseStreamController = container.get<GenerateExerciseStreamController>("GenerateExerciseStreamController");
  app.get('/lessons/:lessonId/exercise/stream', authMiddleware, requireRole(['student', 'admin']), (req, res) => generateExerciseStreamController.run(req, res));

  // POST /lessons/:lessonId/exercise/validate - Validar respuesta de un ejercicio (síncrono con IA)
  app.post('/lessons/:lessonId/exercise/validate', authMiddleware, requireRole(['student', 'admin']), (req, res) => validateExerciseController.run(req, res));

  // POST /lessons/:lessonId/exercise/submit - Enviar respuesta para evaluación (crea intento)
  app.post('/lessons/:lessonId/exercise/submit', authMiddleware, requireRole(['student', 'admin']), (req, res) => submitExerciseController.run(req, res));

  // GET /lessons/:lessonId/exercise/attempt-status - Consultar estado del intento actual
  app.get('/lessons/:lessonId/exercise/attempt-status', authMiddleware, requireRole(['student', 'admin']), (req, res) => getAttemptStatusController.run(req, res));

  // POST /webhooks/gemini/evaluation - Webhook para recibir evaluaciones de Gemini
  // NOTA: Este endpoint NO debe tener autenticación si es llamado por un servicio externo
  // En producción, considera agregar un API key o firma de webhook
  app.post('/webhooks/gemini/evaluation', (req, res) => evaluationWebhookController.run(req, res));
};
