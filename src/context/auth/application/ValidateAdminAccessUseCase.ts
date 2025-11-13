import { UserRepository } from '../../users/domain/UserRepository';

export interface ValidateAdminAccessRequest {
  userId: string;
}

export interface ValidateAdminAccessResponse {
  hasAccess: boolean;
  role: 'student' | 'admin';
  message: string;
}

export class ValidateAdminAccessUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(request: ValidateAdminAccessRequest): Promise<ValidateAdminAccessResponse> {
    // Buscar usuario en Firestore
    const user = await this.userRepository.findById(request.userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const role = user.getRole();
    const hasAccess = role === 'admin';

    return {
      hasAccess,
      role,
      message: hasAccess
        ? 'Usuario tiene acceso al dashboard administrativo'
        : 'Usuario no tiene permisos de administrador',
    };
  }
}
