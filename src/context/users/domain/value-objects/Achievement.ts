/**
 * Value Object: Achievement
 * Representa un logro desbloqueado por el usuario
 */
export class Achievement {
  private constructor(
    public readonly achievementId: string,
    public readonly unlockedAt: Date
  ) {}

  static create(achievementId: string, unlockedAt?: Date): Achievement {
    return new Achievement(
      achievementId,
      unlockedAt || new Date()
    );
  }

  /**
   * Crea Achievement desde datos de persistencia
   */
  static fromPrimitives(data: {
    achievement_id: string;
    unlocked_at: Date | { toDate: () => Date };
  }): Achievement {
    const unlockedDate = data.unlocked_at instanceof Date
      ? data.unlocked_at
      : data.unlocked_at.toDate();

    return new Achievement(
      data.achievement_id,
      unlockedDate
    );
  }

  /**
   * Verifica si el logro fue desbloqueado en una fecha específica
   */
  wasUnlockedOn(date: Date): boolean {
    return this.unlockedAt.toDateString() === date.toDateString();
  }

  /**
   * Obtiene los días transcurridos desde el desbloqueo
   */
  getDaysSinceUnlock(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.unlockedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Convierte el value object a primitivos para persistencia
   */
  toPrimitives(): AchievementPrimitives {
    return {
      achievement_id: this.achievementId,
      unlocked_at: this.unlockedAt
    };
  }
}

export type AchievementPrimitives = {
  achievement_id: string;
  unlocked_at: Date;
};

/**
 * Collection de Achievements
 */
export class AchievementCollection {
  private constructor(
    public readonly achievements: Achievement[]
  ) {}

  /**
   * Crea una colección vacía
   */
  static empty(): AchievementCollection {
    return new AchievementCollection([]);
  }

  /**
   * Crea una colección desde datos de persistencia
   */
  static fromArray(data: Array<{
    achievement_id: string;
    unlocked_at: Date | { toDate: () => Date };
  }>): AchievementCollection {
    const achievements = data.map(item => Achievement.fromPrimitives(item));
    return new AchievementCollection(achievements);
  }

  /**
   * Añade un nuevo logro a la colección
   */
  add(achievement: Achievement): AchievementCollection {
    // Evitar duplicados
    if (this.has(achievement.achievementId)) {
      return this;
    }

    return new AchievementCollection([...this.achievements, achievement]);
  }

  /**
   * Verifica si un logro ya existe en la colección
   */
  has(achievementId: string): boolean {
    return this.achievements.some(a => a.achievementId === achievementId);
  }

  /**
   * Obtiene un logro específico
   */
  get(achievementId: string): Achievement | undefined {
    return this.achievements.find(a => a.achievementId === achievementId);
  }

  /**
   * Obtiene el total de logros
   */
  count(): number {
    return this.achievements.length;
  }

  /**
   * Obtiene los logros desbloqueados en un rango de fechas
   */
  getByDateRange(startDate: Date, endDate: Date): Achievement[] {
    return this.achievements.filter(achievement => {
      const unlockedTime = achievement.unlockedAt.getTime();
      return unlockedTime >= startDate.getTime() && unlockedTime <= endDate.getTime();
    });
  }

  /**
   * Obtiene los últimos N logros desbloqueados
   */
  getRecent(count: number): Achievement[] {
    return [...this.achievements]
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, count);
  }

  /**
   * Convierte la colección a un array para persistencia
   */
  toPrimitives(): AchievementPrimitives[] {
    return this.achievements.map(achievement => achievement.toPrimitives());
  }
}
