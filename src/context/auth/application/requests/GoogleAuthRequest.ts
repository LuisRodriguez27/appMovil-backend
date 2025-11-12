export class GoogleAuthRequest {
  constructor(
    public readonly idToken: string
  ) {
    if (!idToken || idToken.trim() === '') {
      throw new Error('El token de Firebase es requerido');
    }
  }
}
