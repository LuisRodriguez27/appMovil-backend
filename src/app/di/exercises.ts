import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { GeminiExerciseGenerator } from '../../context/exercises/infrastructure/gemini/GeminiExerciseGenerator';
import { GenerateExerciseUseCase } from '../../context/exercises/application/GenerateExerciseUseCase';
import { ValidateExerciseAnswerUseCase } from '../../context/exercises/application/ValidateExerciseAnswerUseCase';
import { SubmitExerciseAnswerUseCase } from '../../context/exercises/application/SubmitExerciseAnswerUseCase';
import { GetAttemptStatusUseCase } from '../../context/exercises/application/GetAttemptStatusUseCase';
import { ProcessEvaluationWebhookUseCase } from '../../context/exercises/application/ProcessEvaluationWebhookUseCase';
import { GenerateExerciseController } from '../../context/exercises/infrastructure/controllers/GenerateExerciseController';
import { ValidateExerciseController } from '../../context/exercises/infrastructure/controllers/ValidateExerciseController';
import { SubmitExerciseController } from '../../context/exercises/infrastructure/controllers/SubmitExerciseController';
import { GetAttemptStatusController } from '../../context/exercises/infrastructure/controllers/GetAttemptStatusController';
import { EvaluationWebhookController } from '../../context/exercises/infrastructure/controllers/EvaluationWebhookController';

export default function registerExercisesDependencies(container: ContainerBuilder) {
    // Importar la configuración
    const { GeminiConfig } = require('../config/config');

    // Gemini Generator (singleton) - Pasar la API key explícitamente
    container
      .register('GeminiExerciseGenerator', GeminiExerciseGenerator)
      .addArgument(GeminiConfig.apiKey);
  // Use Cases
  container
    .register('GenerateExerciseUseCase', GenerateExerciseUseCase)
    .addArgument(new Reference('LessonRepository'))
    .addArgument(new Reference('SubtopicRepository'))
    .addArgument(new Reference('GeminiExerciseGenerator'));

  container
    .register('ValidateExerciseAnswerUseCase', ValidateExerciseAnswerUseCase)
    .addArgument(new Reference('LessonRepository'))
    .addArgument(new Reference('GeminiExerciseGenerator'))
    .addArgument(new Reference('GenerateExerciseUseCase'));

  container
    .register('SubmitExerciseAnswerUseCase', SubmitExerciseAnswerUseCase)
    .addArgument(new Reference('UserRepository'))
    .addArgument(new Reference('LessonRepository'))
    .addArgument(new Reference('CourseRepository'))
    .addArgument(new Reference('NextLessonCalculator'));

  container
    .register('GetAttemptStatusUseCase', GetAttemptStatusUseCase)
    .addArgument(new Reference('UserRepository'));

  container
    .register('ProcessEvaluationWebhookUseCase', ProcessEvaluationWebhookUseCase)
    .addArgument(new Reference('UserRepository'));

  // Controllers
  container
    .register('GenerateExerciseController', GenerateExerciseController)
    .addArgument(new Reference('GenerateExerciseUseCase'));

  container
    .register('ValidateExerciseController', ValidateExerciseController)
    .addArgument(new Reference('ValidateExerciseAnswerUseCase'));

  container
    .register('SubmitExerciseController', SubmitExerciseController)
    .addArgument(new Reference('SubmitExerciseAnswerUseCase'));

  container
    .register('GetAttemptStatusController', GetAttemptStatusController)
    .addArgument(new Reference('GetAttemptStatusUseCase'));

  container
    .register('EvaluationWebhookController', EvaluationWebhookController)
    .addArgument(new Reference('ProcessEvaluationWebhookUseCase'));

  return container;
}
