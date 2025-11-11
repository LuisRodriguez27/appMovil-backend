export class RefreshTokenRequest {
  constructor(
    public readonly refreshToken: string
  ) {
    if (!refreshToken) {
      throw new Error('Refresh token es requerido');
    }
  }
}
