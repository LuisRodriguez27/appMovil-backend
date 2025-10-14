import { UserPreferences } from '../../domain/User';

export class UpdateUserRequest {
  constructor(
    public readonly name?: string,
    public readonly email?: string,
    public readonly carrera?: string,
    public readonly semestre?: number,
    public readonly currentCourse?: string | null,
    public readonly learningStyle?: string | null,
    public readonly profilePicture?: string | null,
    public readonly preferences?: Partial<UserPreferences>
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.email !== undefined && !this.isValidEmail(this.email)) {
      throw new Error('Email inválido');
    }

    if (this.semestre !== undefined && (this.semestre < 1 || this.semestre > 12)) {
      throw new Error('Semestre debe estar entre 1 y 12');
    }

    if (this.carrera !== undefined) {
      const carrerasValidas = ['ISC', 'IIA', 'IM', 'IE', 'LA', 'CP', 'IGE', 'ARQ'];
      if (!carrerasValidas.includes(this.carrera.toUpperCase())) {
        throw new Error(`Carrera debe ser una de: ${carrerasValidas.join(', ')}`);
      }
    }

    if (this.preferences?.theme !== undefined) {
      if (!['light', 'dark'].includes(this.preferences.theme)) {
        throw new Error('Theme debe ser "light" o "dark"');
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
