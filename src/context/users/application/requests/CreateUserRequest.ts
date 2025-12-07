export class CreateUserRequest {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly profilePicture?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Nombre es requerido');
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error('Email válido es requerido');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
