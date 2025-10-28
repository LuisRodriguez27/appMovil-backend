/**
 * Value Object: UserAchievement
 * Representa un logro desbloqueado por el usuario (referencia al contexto de achievements)
 *
 * Este value object solo almacena la relación entre el usuario y un logro:
 * - achievementId: Referencia al logro en el contexto de achievements
 * - unlockedAt: Fecha en que el usuario desbloqueó el logro
 *
 * Los detalles del logro (título, descripción, puntos, rareza, etc.)
 * se obtienen del contexto de achievements
 */
export class UserAchievement {
  private constructor(
    public readonly achievementId: string,
    public readonly unlockedAt: Date
  ) {
    this.validate();
  }

  static create(achievementId: string, unlockedAt?: Date): UserAchievement {
    return new UserAchievement(
      achievementId,
      unlockedAt || new Date()
    );
  }

  /**
   * Crea UserAchievement desde datos de persistencia
   */
  static fromPrimitives(data: {
    achievement_id: string;
    unlocked_at: Date | { toDate: () => Date };
  }): UserAchievement {
    const unlockedDate = data.unlocked_at instanceof Date
      ? data.unlocked_at
      : data.unlocked_at.toDate();

    return new UserAchievement(
      data.achievement_id,
      unlockedDate
    );
  }

  /**
   * Valida que el achievementId no esté vacío
   */
  private validate(): void {
    if (!this.achievementId || this.achievementId.trim() === '') {
      throw new Error('Achievement ID no puede estar vacío');
    }
  }

  /**
   * Convierte el value object a primitivos para persistencia
   */
  toPrimitives(): UserAchievementPrimitives {
    return {
      achievement_id: this.achievementId,
      unlocked_at: this.unlockedAt
    };
  }
}

export type UserAchievementPrimitives = {
  achievement_id: string;
  unlocked_at: Date;
};

/**
 * Collection de UserAchievements
 * Gestiona los logros desbloqueados por el usuario
 */
export class UserAchievementCollection {
  private constructor(
    public readonly achievements: UserAchievement[]
  ) {}

  /**
   * Crea una colección vacía
   */
  static empty(): UserAchievementCollection {
    return new UserAchievementCollection([]);
  }

  /**
   * Crea una colección desde datos de persistencia
   */
  static fromArray(data: Array<{
    achievement_id: string;
    unlocked_at: Date | { toDate: () => Date };
  }>): UserAchievementCollection {
    const achievements = data.map(item => UserAchievement.fromPrimitives(item));
    return new UserAchievementCollection(achievements);
  }

  /**
   * Añade un nuevo logro a la colección (evita duplicados)
   */
  add(achievement: UserAchievement): UserAchievementCollection {
    if (this.has(achievement.achievementId)) {
      return this;
    }

    return new UserAchievementCollection([...this.achievements, achievement]);
  }

  /**
   * Verifica si un logro ya existe en la colección
   */
  has(achievementId: string): boolean {
    return this.achievements.some(a => a.achievementId === achievementId);
  }

  /**
   * Obtiene un logro específico por su ID
   */
  get(achievementId: string): UserAchievement | undefined {
    return this.achievements.find(a => a.achievementId === achievementId);
  }

  /**
   * Obtiene el total de logros desbloqueados
   */
  count(): number {
    return this.achievements.length;
  }

  /**
   * Obtiene los logros desbloqueados en un rango de fechas
   */
  getByDateRange(startDate: Date, endDate: Date): UserAchievement[] {
    return this.achievements.filter(achievement => {
      const unlockedTime = achievement.unlockedAt.getTime();
      return unlockedTime >= startDate.getTime() && unlockedTime <= endDate.getTime();
    });
  }

  /**
   * Obtiene los últimos N logros desbloqueados (más recientes primero)
   */
  getRecent(count: number): UserAchievement[] {
    return [...this.achievements]
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, count);
  }

  /**
   * Convierte la colección a un array para persistencia
   */
  toPrimitives(): UserAchievementPrimitives[] {
    return this.achievements.map(achievement => achievement.toPrimitives());
  }
}
