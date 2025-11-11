import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';

export class UpdateUserXPUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, xpToAdd: number): Promise<User> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('ID de usuario es requerido');
    }

    if (xpToAdd < 0) {
      throw new Error('Los puntos XP no pueden ser negativos');
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    user.addXP(xpToAdd);

    await this.userRepository.update(user);


    return user;
  }
}
