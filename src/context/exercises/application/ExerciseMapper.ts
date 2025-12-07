import { ExerciseDTO } from './dtos/ExerciseDTO';
import {
  FillBlankContent,
  MultipleChoiceContent,
  TrueFalseContent,
  CodeCompletionContent,
  FlowchartContent
} from '../domain/value-objects/ExerciseContent';
import { Exercise } from '../domain/Exercise';

export class ExerciseMapper {
  public static toDTO(exercise: Exercise): ExerciseDTO {
    const { lessonId, type, instructions, maxPoints, content } = exercise;

    const baseDTO: Partial<ExerciseDTO> = {
      lessonId,
      type,
      instructions,
      maxPoints
    };

    switch (content.type) {
      case 'fill_blank': {
        const data = content.data as FillBlankContent;
        return {
          ...baseDTO,
          title: instructions,
          textWithBlanks: data.text,
          blanks: data.blanks,
          tip: data.tip,
        } as ExerciseDTO;
      }
      case 'multiple_choice': {
        const data = content.data as MultipleChoiceContent;
        return {
          ...baseDTO,
          title: instructions,
          question: data.question,
          options: data.options,
          correctOptionId: data.correctOptionId,
          tip: data.tip,
        } as ExerciseDTO;
      }
      case 'true_false': {
        const data = content.data as TrueFalseContent;
        return {
          ...baseDTO,
          title: instructions,
          statement: data.statement,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          tip: data.tip,
        } as ExerciseDTO;
      }
      case 'code_completion': {
        const data = content.data as CodeCompletionContent;
        return {
          ...baseDTO,
          title: instructions,
          starterCode: data.starterCode,
          expectedOutput: data.expectedOutput,
          correctCode: data.correctCode,
          tip: data.tip,
        } as ExerciseDTO;
      }
      case 'flowchart': {
        const data = content.data as FlowchartContent;
        return {
          ...baseDTO,
          title: data.title,
          nodes: data.nodes,
          connections: data.connections,
          tip: data.tip,
        } as ExerciseDTO;
      }
      default:
        throw new Error(`Unsupported exercise type for DTO mapping: ${(content as any).type}`);
    }
  }
}