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
    controlNumber?: string;
    profilePicture?: string;
    xp?: number;
  };
  isNewUser: boolean;
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
      return {
        user: {
          __id: user.getId(),
          name: user.getName(),
          email: user.getEmail(),
          role: user.getRole(),
          profilePicture: user.getProfilePicture(),
          xp: user.getXP(),
        },
        isNewUser: false,
        message: 'Inicio de sesión exitoso',
      };
    }

    // Usuario no existe en Firestore, crear nuevo
    // Validar que se proporcione el número de control para nuevos usuarios
    if (!request.controlNumber) {
      throw new Error('El número de control es requerido para nuevos usuarios');
    }

    // Crear nuevo usuario en Firestore con el UID de Firebase Auth
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
      },
      isNewUser: true,
      message: 'Usuario registrado exitosamente',
    };
  }
}
