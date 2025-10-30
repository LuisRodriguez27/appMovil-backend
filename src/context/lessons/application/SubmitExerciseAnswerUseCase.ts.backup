import { LessonRepository } from "../domain/LessonRepository";
import { UserRepository } from "../../users/domain/UserRepository";

interface SubmitExerciseAnswerRequest {
  userId: string;
  lessonId: string;
  exerciseId: string;
  answer: string | string[];
}

interface SubmitExerciseAnswerResponse {
  exerciseId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  correctAnswer?: string | string[];
  userAnswer: string | string[];
  feedback: string;
}

export class SubmitExerciseAnswerUseCase {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly userRepository: UserRepository
  ) {}

  async execute(request: SubmitExerciseAnswerRequest): Promise<SubmitExerciseAnswerResponse> {
    const { userId, lessonId, exerciseId, answer } = request;

    // 1. Validar inputs
    if (!userId || userId.trim().length === 0) {
      throw new Error('ID de usuario es requerido');
    }

    if (!lessonId || lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    if (!exerciseId || exerciseId.trim().length === 0) {
      throw new Error('ID de ejercicio es requerido');
    }

    if (answer === undefined || answer === null) {
      throw new Error('Respuesta es requerida');
    }

    // Validar que la respuesta no esté vacía
    if (typeof answer === 'string' && answer.trim().length === 0) {
      throw new Error('Respuesta no puede estar vacía');
    }

    if (Array.isArray(answer) && answer.length === 0) {
      throw new Error('Respuesta no puede estar vacía');
    }

    // 2. Validar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // 3. Obtener lección
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lección no encontrada');
    }

    // 4. Obtener ejercicio
    const exercise = lesson.getExerciseById(exerciseId);
    if (!exercise) {
      throw new Error('Ejercicio no encontrado');
    }

    // 5. Validar respuesta según tipo de ejercicio
    const isCorrect = this.validateAnswer(exercise, answer);

    // 6. Calcular puntos ganados
    const pointsEarned = isCorrect ? exercise.max_points : 0;

    // 7. Generar feedback motivacional
    const feedback = this.generateFeedback(isCorrect, exercise.type);

    // 8. Construir respuesta
    const response: SubmitExerciseAnswerResponse = {
      exerciseId: exercise.id,
      isCorrect,
      pointsEarned,
      maxPoints: exercise.max_points,
      userAnswer: answer,
      feedback
    };

    // Solo mostrar respuesta correcta si el usuario falló
    if (!isCorrect && exercise.type !== 'open_ended') {
      response.correctAnswer = exercise.correct_answer;
    }

    return response;
  }

  private validateAnswer(exercise: any, userAnswer: string | string[]): boolean {
    const { type, correct_answer } = exercise;

    switch (type) {
      case 'fill_blank':
        return this.validateFillBlank(userAnswer as string, correct_answer as string);

      case 'multiple_choice':
        return this.validateMultipleChoice(userAnswer as string, correct_answer as string);

      case 'code_completion':
        return this.validateCodeCompletion(userAnswer as string, correct_answer as string);

      case 'true_false':
        return this.validateTrueFalse(userAnswer as string, correct_answer as string);

      case 'open_ended':
        // Siempre correcto (requiere revisión manual)
        return true;

      default:
        throw new Error(`Tipo de ejercicio no soportado: ${type}`);
    }
  }

  private validateFillBlank(userAnswer: string, correctAnswer: string): boolean {
    // Normalizar: trim y lowercase
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();

    return normalizedUser === normalizedCorrect;
  }

  private validateMultipleChoice(userAnswer: string, correctAnswer: string): boolean {
    // Comparación exacta
    return userAnswer === correctAnswer;
  }

  private validateCodeCompletion(userAnswer: string, correctAnswer: string): boolean {
    // Normalizar código: eliminar espacios extras, saltos de línea múltiples
    const normalizeCode = (code: string): string => {
      return code
        .trim()
        .replace(/\s+/g, ' ') // Múltiples espacios → un espacio
        .replace(/\n+/g, '\n') // Múltiples saltos → un salto
        .toLowerCase();
    };

    return normalizeCode(userAnswer) === normalizeCode(correctAnswer);
  }

  private validateTrueFalse(userAnswer: string, correctAnswer: string): boolean {
    // Comparación exacta
    return userAnswer === correctAnswer;
  }

  private generateFeedback(isCorrect: boolean, exerciseType: string): string {
    if (isCorrect) {
      const correctMessages = [
        '¡Excelente! ✨',
        '¡Perfecto! 🎯',
        '¡Muy bien! 🌟',
        '¡Correcto! 👏',
        '¡Genial! 🚀',
        '¡Increíble! ⭐'
      ];
      return correctMessages[Math.floor(Math.random() * correctMessages.length)];
    } else {
      if (exerciseType === 'open_ended') {
        return 'Respuesta registrada. Será revisada manualmente. 📝';
      }

      const incorrectMessages = [
        'No es correcto. ¡Inténtalo de nuevo! 💪',
        'Casi... ¡Sigue intentando! 🎯',
        'No te rindas, lo lograrás! 💫',
        'Revisa la respuesta e intenta nuevamente. 📚',
        '¡No te desanimes! La práctica hace al maestro. 🌟'
      ];
      return incorrectMessages[Math.floor(Math.random() * incorrectMessages.length)];
    }
  }
}
