import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';

export class UnlockAchievementUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(userId: string, achievementId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const unlocked = user.unlockAchievement(achievementId);

        if (unlocked) {
            await this.userRepository.update(user);
        }

        return user;
    }
}
