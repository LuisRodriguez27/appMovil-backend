import { GoogleGenAI } from '@google/genai';
import { GeminiConfig } from '../../../../app/config/config';
import { Exercise } from '../../domain/Exercise';
import { ExerciseType } from '../../domain/value-objects/ExerciseType';
import { PromptBuilder } from './PromptBuilder';
import { ExerciseParser } from './ExerciseParser';

export interface ExerciseGeneratorParams {
  lessonId: string;
  subtopicTitle: string;
  lessonContent: string;
  instructions: string;
  type: ExerciseType;
  maxPoints: number;
}

export class GeminiExerciseGenerator {
  private ai: GoogleGenAI;
  private model: any;

  constructor(apiKey?: string) {
    const key = apiKey || GeminiConfig.apiKey;

    if (!key) {
      throw new Error('Gemini API key no configurada. Por favor configura GEMINI_API_KEY en el archivo .env');
    }

    this.ai = new GoogleGenAI({ apiKey: key });
    this.model = GeminiConfig.model; // Solo guardamos el nombre del modelo
  }

  async generateExercise(params: ExerciseGeneratorParams): Promise<Exercise> {
    try {
      console.log(`Generando ejercicio de tipo ${params.type} para lección ${params.lessonId}`);

      // Construir el prompt
      const prompt = PromptBuilder.build({
        subtopicTitle: params.subtopicTitle,
        lessonContent: params.lessonContent,
        instructions: params.instructions,
        type: params.type,
        maxPoints: params.maxPoints
      });

      // Llamar a Gemini
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: GeminiConfig.temperature,
          maxOutputTokens: GeminiConfig.maxOutputTokens,
        }
      });

      const text = result.text || '';

      console.log('Respuesta de Gemini recibida:', text.substring(0, 200) + '...');

      // Parsear la respuesta
      const exerciseContent = ExerciseParser.parse(params.type, text);

      // Crear el ejercicio
      const exercise = new Exercise(
        params.lessonId,
        params.type,
        params.instructions,
        exerciseContent,
        params.maxPoints
      );

      console.log(`Ejercicio generado exitosamente para lección ${params.lessonId}`);

      return exercise;
    } catch (error) {
      console.error('Error al generar ejercicio con Gemini:', error);
      throw new Error(
        `Error al generar ejercicio: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }

  async evaluateAnswer(
    exerciseType: ExerciseType,
    exerciseContent: any,
    userAnswer: any
  ): Promise<{ score: number; feedback: string; suggestions?: string }> {
    try {
      console.log(`Evaluando respuesta para ejercicio de tipo ${exerciseType}`);

      // Construir el prompt de evaluación
      const prompt = PromptBuilder.buildEvaluationPrompt(
        exerciseType,
        exerciseContent,
        userAnswer
      );

      // Llamar a Gemini
      const result = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          temperature: GeminiConfig.temperature,
          maxOutputTokens: GeminiConfig.maxOutputTokens,
        }
      });

      const text = result.text || '';

      console.log('Respuesta de evaluación recibida:', text);

      // Parsear la respuesta
      const evaluation = ExerciseParser.parseEvaluation(text);

      console.log(`Evaluación completada: ${evaluation.score}/100`);

      return evaluation;
    } catch (error) {
      console.error('Error al evaluar respuesta con Gemini:', error);
      throw new Error(
        `Error al evaluar respuesta: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  }
}
