export class CompleteLessonRequest {
  constructor(
    public readonly userId: string,
    public readonly lessonId: string,
    public readonly pointsEarned: number,
    public readonly timeSpent: number // en minutos
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('ID de usuario es requerido');
    }

    if (!this.lessonId || this.lessonId.trim().length === 0) {
      throw new Error('ID de lección es requerido');
    }

    if (this.pointsEarned < 0) {
      throw new Error('Los puntos ganados no pueden ser negativos');
    }

    if (this.timeSpent < 0) {
      throw new Error('El tiempo empleado no puede ser negativo');
    }
  }
}
