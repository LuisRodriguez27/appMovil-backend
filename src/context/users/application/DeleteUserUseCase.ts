import { UserRepository } from '../domain/UserRepository';

export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de usuario es requerido');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await this.userRepository.delete(id);
  }
}
