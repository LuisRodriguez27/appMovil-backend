import { UserRepository } from '../domain/UserRepository';
import { AchievementRepository } from '../../achievements/domain/AchievementRepository';
import { UnlockAchievementUseCase } from './UnlockAchievementUseCase';

export class CompleteLessonUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly achievementRepository: AchievementRepository,
        private readonly unlockAchievementUseCase: UnlockAchievementUseCase
    ) { }

    async execute(userId: string, courseId: string, lessonId: string, nextLessonId: string, totalLessons: number): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        // 1. Mark lesson as complete
        user.completeLesson(courseId, lessonId, nextLessonId, totalLessons);
        await this.userRepository.update(user);

        // 2. Check for Achievements
        const achievements = await this.achievementRepository.findAll();
        const stats = user.getStats();

        if (!stats) return;

        for (const achievement of achievements) {
            const condition = achievement.toPrimitives().condition;

            // Check 'complete_lessons' condition
            if (condition.type === 'complete_lessons' && typeof condition.value === 'number') {
                if (stats.totalLessonsCompleted >= condition.value) {
                    // Try to unlock (it checks if already unlocked inside the UseCase/User)
                    await this.unlockAchievementUseCase.execute(userId, achievement.id);
                }
            }
        }
    }
}
