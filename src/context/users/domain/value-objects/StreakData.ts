export class StreakData {
  private constructor(
    public readonly currentStreak: number,
    public readonly bestStreak: number,
    public readonly lastStudyDate: string | null,
  ) {}

  static create(data?: {
    currentStreak?: number;
    bestStreak?: number;
    lastStudyDate?: string | null;
  }): StreakData {
    return new StreakData(
      data?.currentStreak || 0,
      data?.bestStreak || 0,
      data?.lastStudyDate ?? null
    );
  }

  static fromPrimitives(data: {
    currentStreak: number;
    bestStreak: number;
    lastStudyDate: string | null;
  }): StreakData {
    return new StreakData(
      data.currentStreak,
      data.bestStreak,
      data.lastStudyDate
    );
  }

  updateStreak(today: string): StreakData {
    // Si no hay fecha previa, es el primer día
    if (!this.lastStudyDate) {
      return new StreakData(1, 1, today);
    }

    // Si es el mismo día, no hacer nada
    if (this.lastStudyDate === today) {
      return this;
    }

    const lastDate = new Date(this.lastStudyDate);
    const currentDate = new Date(today);
    
    // Calcular diferencia en días
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Día consecutivo - incrementar racha
      const newStreak = this.currentStreak + 1;
      return new StreakData(
        newStreak,
        Math.max(newStreak, this.bestStreak),
        today
      );
    } else if (daysDiff > 1) {
      // Se rompió la racha - reiniciar a 1
      return new StreakData(
        1,
        this.bestStreak,
        today
      );
    }

    // Día anterior (daysDiff < 0) - no actualizar
    return this;
  }

  /**
   * Verifica si la racha está activa (estudió hoy o ayer)
   */
  isActive(today: string): boolean {
    if (!this.lastStudyDate) return false;

    const lastDate = new Date(this.lastStudyDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return daysDiff <= 1;
  }

  /**
   * Verifica si la racha está en riesgo (estudió ayer pero no hoy)
   */
  isAtRisk(today: string): boolean {
    if (!this.lastStudyDate) return false;

    const lastDate = new Date(this.lastStudyDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return daysDiff === 1;
  }

  /**
   * Verifica si la racha se ha roto
   */
  isBroken(today: string): boolean {
    if (!this.lastStudyDate) return false;

    const lastDate = new Date(this.lastStudyDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return daysDiff > 1;
  }

  /**
   * Obtiene el número de días hasta que se pierda la racha
   */
  getDaysUntilLost(today: string): number {
    if (!this.lastStudyDate) return 0;

    const lastDate = new Date(this.lastStudyDate);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - lastDate.getTime();
    const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (daysDiff >= 2) return 0; // Ya se perdió
    if (daysDiff === 1) return 0; // Hoy es el último día
    return 1; // Tiene hasta mañana
  }

  /**
   * Convierte el value object a primitivos para persistencia
   */
  toPrimitives(): StreakDataPrimitives {
    return {
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      lastStudyDate: this.lastStudyDate,
    };
  }
}

export type StreakDataPrimitives = {
  currentStreak: number;
  bestStreak: number;
  lastStudyDate: string | null;
};
