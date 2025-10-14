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
    const existingUserByNumeroControl = await this.userRepository.findByNumeroControl(request.numeroControl);
    if (existingUserByNumeroControl) {
      throw new Error('El número de control ya está registrado');
    }

    // Crear el usuario
    const user = User.create({
      numeroControl: request.numeroControl,
      name: request.name,
      email: request.email,
      carrera: request.carrera.toUpperCase(),
      semestre: request.semestre,
      xp: 0,
      level: 1,
      streak: 0,
      currentCourse: null,
      learningStyle: request.learningStyle || null,
      profilePicture: request.profilePicture || null,
      preferences: {
        theme: 'light',
        notifications: true,
      },
    });

    await this.userRepository.create(user);

    return user;
  }
}
