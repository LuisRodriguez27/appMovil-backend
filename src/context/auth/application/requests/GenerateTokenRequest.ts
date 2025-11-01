export class GenerateTokenRequest {
  constructor(
    public readonly userType: 'student' | 'admin'
  ) {
    if (!userType || !['student', 'admin'].includes(userType)) {
      throw new Error('userType es requerido y debe ser "student" o "admin"');
    }
  }
}
