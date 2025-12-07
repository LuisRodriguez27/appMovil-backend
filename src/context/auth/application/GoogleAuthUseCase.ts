import { firebaseAuth } from '../../../app/config/configureFirebase';
import { UserRepository } from '../../users/domain/UserRepository';
import { User } from '../../users/domain/User';
import { GoogleAuthRequest } from './requests/GoogleAuthRequest';

export interface GoogleAuthResponse {
  user: {
    __id: string;
    name: string;
    email: string;
    role: 'student' | 'admin';
    profilePicture?: string;
    xp?: number;
    currentCourseId?: string;
    progress?: any; // Progreso del usuario (lecciones completadas, etc.)
  };
  isNewUser: boolean;
  needsOnboarding: boolean;
  message: string;
}

/**
 * Caso de uso para autenticación con Google
 *
 * Flujo:
 * 1. Frontend autentica con Google usando Firebase Auth
 * 2. Frontend obtiene el idToken
 * 3. Frontend envía el idToken al backend
 * 4. Backend verifica el token y extrae la información del usuario
 * 5. Backend busca o crea el usuario en Firestore usando el UID de Firebase Auth
 */
export class GoogleAuthUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    // Verificar el token con Firebase Admin SDK
    const decodedToken = await firebaseAuth().verifyIdToken(request.idToken);

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      throw new Error('El token no contiene un email válido');
    }

    // Buscar usuario existente en Firestore por UID
    let user = await this.userRepository.findById(uid);

    if (user) {
      // Usuario ya existe, retornar sus datos
      // Verificar si necesita completar onboarding:
      // - Si no tiene currentCourseId O
      // - Si no tiene ningún curso en progress
      const userProgress = user.getProgress();
      const hasCourses = userProgress && userProgress.courses.size > 0;
      const needsOnboarding = !user.getCurrentCourseId() || !hasCourses;

      return {
        user: {
          __id: user.getId(),
          name: user.getName(),
          email: user.getEmail(),
          role: user.getRole(),
          profilePicture: user.getProfilePicture(),
          xp: user.getXP(),
          currentCourseId: user.getCurrentCourseId(),
          progress: user.getProgress() ? user.toPrimitives().progress : undefined,
        },
        isNewUser: false,
        needsOnboarding,
        message: 'Inicio de sesión exitoso',
      };
    }

    // Usuario no existe en Firestore, crear nuevo
    const newUser = User.fromPrimitives({
      __id: uid,
      name: name || 'Usuario',
      email: email,
      role: 'student',
      xp: 0,
      profilePicture: picture,
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

    await this.userRepository.create(newUser);

    return {
      user: {
        __id: newUser.getId(),
        name: newUser.getName(),
        email: newUser.getEmail(),
        role: newUser.getRole(),
        profilePicture: newUser.getProfilePicture(),
        xp: newUser.getXP(),
        currentCourseId: newUser.getCurrentCourseId(),
        progress: newUser.getProgress() ? newUser.toPrimitives().progress : undefined,
      },
      isNewUser: true,
      needsOnboarding: true, // Los nuevos usuarios siempre necesitan completar onboarding
      message: 'Usuario registrado exitosamente',
    };
  }
}
