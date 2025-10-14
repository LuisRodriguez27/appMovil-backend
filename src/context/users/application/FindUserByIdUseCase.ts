import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';

export class FindUserByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<User> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de usuario es requerido');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }
}
