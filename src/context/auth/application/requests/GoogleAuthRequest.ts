export class GoogleAuthRequest {
  constructor(
    public readonly idToken: string,
    public readonly controlNumber?: string
  ) {
    if (!idToken || idToken.trim() === '') {
      throw new Error('El token de Firebase es requerido');
    }
  }
}
