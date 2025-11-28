import { ExerciseType } from '../../domain/value-objects/ExerciseType';
import { ExerciseContent, createExerciseContent } from '../../domain/value-objects/ExerciseContent';

export class ExerciseParser {
  static parse(type: ExerciseType, geminiResponse: string): ExerciseContent {
    try {
      // Limpiar la respuesta de posibles artifacts
      let cleanedResponse = geminiResponse.trim();

      // Remover bloques de código markdown si existen
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      cleanedResponse = cleanedResponse.trim();
      
      // Intentar remover comas flotantes (trailing commas) que son un error común de la IA
      cleanedResponse = cleanedResponse.replace(/,\s*([}\]])/g, '$1');

      // Parsear JSON
      const data = JSON.parse(cleanedResponse);

      // Validar que tenga los campos necesarios según el tipo
      this.validateExerciseData(type, data);

      // Crear el contenido del ejercicio
      return createExerciseContent(type, data);
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.error('Raw response:', geminiResponse);
      console.error('Cleaned response attempt:', cleanedResponse);
      throw new Error(`Error al parsear la respuesta de Gemini: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  private static validateExerciseData(type: ExerciseType, data: any): void {
    switch (type) {
      case 'fill_blank':
        if (!data.text || typeof data.text !== 'string') {
          throw new Error('Campo "text" requerido para fill_blank');
        }
        if (!Array.isArray(data.blanks) || data.blanks.length === 0) {
          throw new Error('Campo "blanks" debe ser un array no vacío');
        }
        data.blanks.forEach((blank: any, index: number) => {
          if (typeof blank.id !== 'number' || typeof blank.correctAnswer !== 'string') {
            throw new Error(`Blank ${index} inválido: debe tener "id" (número) y "correctAnswer" (string)`);
          }
          if (!Array.isArray(blank.incorrectAnswers) || blank.incorrectAnswers.length === 0) {
            throw new Error(`Blank ${index} inválido: debe tener "incorrectAnswers" (array de strings)`);
          }
        });
        break;

      case 'multiple_choice':
        if (!data.question || typeof data.question !== 'string') {
          throw new Error('Campo "question" requerido para multiple_choice');
        }
        if (!Array.isArray(data.options) || data.options.length < 2) {
          throw new Error('Campo "options" debe ser un array con al menos 2 opciones');
        }
        if (!data.correctOptionId || typeof data.correctOptionId !== 'string') {
          throw new Error('Campo "correctOptionId" requerido');
        }
        data.options.forEach((option: any, index: number) => {
          if (!option.id || !option.text) {
            throw new Error(`Opción ${index} inválida: debe tener "id" y "text"`);
          }
        });
        break;

      case 'code_completion':
        if (!data.instruction || typeof data.instruction !== 'string') {
          throw new Error('Campo "instruction" requerido para code_completion');
        }
        if (!data.starterCode || typeof data.starterCode !== 'string') {
          throw new Error('Campo "starterCode" requerido');
        }
        break;

      case 'true_false':
        if (!data.statement || typeof data.statement !== 'string') {
          throw new Error('Campo "statement" requerido para true_false');
        }
        if (typeof data.correctAnswer !== 'boolean') {
          throw new Error('Campo "correctAnswer" debe ser boolean');
        }
        break;

      case 'open_ended':
        if (!data.question || typeof data.question !== 'string') {
          throw new Error('Campo "question" requerido para open_ended');
        }
        if (!Array.isArray(data.evaluationCriteria)) {
          throw new Error('Campo "evaluationCriteria" debe ser un array');
        }
        break;

      default:
        throw new Error(`Tipo de ejercicio no soportado: ${type}`);
    }
  }

  static parseEvaluation(geminiResponse: string): { score: number; feedback: string; suggestions?: string } {
    try {
      // Limpiar la respuesta
      let cleanedResponse = geminiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '');
      cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      cleanedResponse = cleanedResponse.trim();

      console.log('=== JSON A PARSEAR (ExerciseParser.parseEvaluation) ===');
      console.log('Longitud respuesta original:', geminiResponse.length);
      console.log('Longitud respuesta limpia:', cleanedResponse.length);
      console.log('Contenido limpio:', cleanedResponse);
      console.log('=== FIN JSON A PARSEAR ===');

      const data = JSON.parse(cleanedResponse);

      if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
        throw new Error('Score debe ser un número entre 0 y 100');
      }

      if (!data.feedback || typeof data.feedback !== 'string') {
        throw new Error('Feedback es requerido');
      }

      return {
        score: data.score,
        feedback: data.feedback,
        suggestions: data.suggestions || undefined
      };
    } catch (error) {
      console.error('Error parsing evaluation response:', error);
      console.error('Raw response:', geminiResponse);
      throw new Error(`Error al parsear la evaluación de Gemini: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
}
