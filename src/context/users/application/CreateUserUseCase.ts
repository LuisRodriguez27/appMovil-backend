import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';
import { CreateUserRequest } from './requests/CreateUserRequest';
import { firebaseAuth } from '../../../app/config/configureFirebase';

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: CreateUserRequest): Promise<User> {
    // Verificar que el email no esté registrado
    const existingUserByEmail = await this.userRepository.findByEmail(request.email);
    if (existingUserByEmail) {
      throw new Error('El email ya está registrado');
    }

    // Crear el usuario en Firebase Authentication
    const userRecord = await firebaseAuth().createUser({
      email: request.email,
      displayName: request.name,
      photoURL: request.profilePicture,
    });

    // Crear el usuario en Firestore con el UID de Firebase Auth
    const user = User.fromPrimitives({
      __id: userRecord.uid,
      name: request.name,
      email: request.email,
      role: 'student', // Por defecto: student
      xp: 0,
      profilePicture: request.profilePicture,
      progress: {},
      achievements: [],
      streakData: {
        currentStreak: 0,
        bestStreak: 0,
        lastStudyDate: null,
      },
      stats: {
        totalLessonsCompleted: 0,
        totalExercisesCompleted: 0,
        totalCoursesCompleted: 0,
      },
      createdAt: new Date().toISOString(),
    });

    await this.userRepository.create(user);

    return user;
  }
}
