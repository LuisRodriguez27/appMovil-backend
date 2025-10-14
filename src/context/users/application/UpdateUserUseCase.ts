import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';
import { UpdateUserRequest } from './requests/UpdateUserRequest';

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string, request: UpdateUserRequest): Promise<User> {
    if (!id || id.trim().length === 0) {
      throw new Error('ID de usuario es requerido');
    }

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el email no esté en uso por otro usuario
    if (request.email && request.email !== user.getEmail()) {
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser && existingUser.getId() !== id) {
        throw new Error('El email ya está en uso por otro usuario');
      }
    }

    // Actualizar usuario
    user.update({
      name: request.name,
      email: request.email,
      currentCourse: request.currentCourse,
      profilePicture: request.profilePicture,
    });

    await this.userRepository.update(user);

    return user;
  }
}
