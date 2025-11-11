import { Lesson } from "../domain/Lesson";
import { LessonRepository } from "../domain/LessonRepository";

export class FindAllLessonsUseCase {
	constructor(private readonly lessonRepository: LessonRepository) {}

	async execute(): Promise<Lesson[]> {
		return this.lessonRepository.findAll();
	}
}