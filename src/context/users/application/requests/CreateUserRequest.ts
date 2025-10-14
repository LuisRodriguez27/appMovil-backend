export class CreateUserRequest {
  constructor(
    public readonly numeroControl: string,
    public readonly name: string,
    public readonly email: string,
    public readonly carrera: string,
    public readonly semestre: number,
    public readonly learningStyle?: string,
    public readonly profilePicture?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.numeroControl || this.numeroControl.trim().length === 0) {
      throw new Error('Número de control es requerido');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nombre es requerido');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Email válido es requerido');
    }

    if (!this.carrera || this.carrera.trim().length === 0) {
      throw new Error('Carrera es requerida');
    }

    if (!this.semestre || this.semestre < 1 || this.semestre > 12) {
      throw new Error('Semestre debe estar entre 1 y 12');
    }

    const carrerasValidas = ['ISC', 'IIA', 'IM', 'IE', 'LA', 'CP', 'IGE', 'ARQ'];
    if (!carrerasValidas.includes(this.carrera.toUpperCase())) {
      throw new Error(`Carrera debe ser una de: ${carrerasValidas.join(', ')}`);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
