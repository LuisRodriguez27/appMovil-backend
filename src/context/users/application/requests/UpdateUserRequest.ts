export class UpdateUserRequest {
  constructor(
    public readonly name?: string,
    public readonly email?: string,
    public readonly currentCourse?: string | null,
    public readonly profilePicture?: string | null,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.email !== undefined && !this.isValidEmail(this.email)) {
      throw new Error('Email inválido');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
