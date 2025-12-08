import { LessonRepository } from "../domain/LessonRepository";
import { ExerciseType } from "../../exercises/domain/value-objects/ExerciseType"; // Importing as requested

export class GroupLessonsByExerciseTypeUseCase {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async execute(): Promise<Record<ExerciseType, string[]>> {
    const lessons = await this.lessonRepository.findAll();
    const grouped: Partial<Record<ExerciseType, string[]>> = {};

    lessons.forEach(lesson => {
      const primitives = lesson.toPrimitives();
      
      if (primitives.exerciseConfigs) {
        primitives.exerciseConfigs.forEach((config) => {
           // We assume the type stored in Lesson matches ExerciseType. 
           // Since they are string literals, it works.
           const type = config.type as ExerciseType;
           
           if (!grouped[type]) {
             grouped[type] = [];
           }
           
           if (!grouped[type]!.includes(lesson.id)) {
             grouped[type]!.push(lesson.id);
           }
        });
      }
    });

    return grouped as Record<ExerciseType, string[]>;
  }
}
