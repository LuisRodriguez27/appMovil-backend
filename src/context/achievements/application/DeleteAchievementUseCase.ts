import { AchievementRepository } from "../domain/AchievementRepository";

export class DeleteAchievementUseCase {
	constructor (private readonly achievementRepository: AchievementRepository) {}

	async execute(id: string): Promise<void> {
		const achievement = await this.achievementRepository.findById(id);

		if (!achievement) {
			throw new Error(`Achievement con el ${id} no encontrado.`);
		}

		await this.achievementRepository.delete(id);
	}
}