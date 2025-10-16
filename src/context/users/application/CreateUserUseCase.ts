import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';
import { CreateUserRequest } from './requests/CreateUserRequest';

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: CreateUserRequest): Promise<User> {
    // Verificar que el email no esté registrado
    const existingUserByEmail = await this.userRepository.findByEmail(request.email);
    if (existingUserByEmail) {
      throw new Error('El email ya está registrado');
    }

    // Verificar que el número de control no esté registrado
    const existingUserByNumeroControl = await this.userRepository.findByNumeroControl(request.controlNumber);
    if (existingUserByNumeroControl) {
      throw new Error('El número de control ya está registrado');
    }

    // Crear el usuario
    const user = User.create({
      controlNumber: request.controlNumber,
      name: request.name,
      email: request.email,
      xp: 0,
      level: 1,
      currentCourse: null,
      profilePicture: request.profilePicture || null
    });

    await this.userRepository.create(user);

    return user;
  }
}
