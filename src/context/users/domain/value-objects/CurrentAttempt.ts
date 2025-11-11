export class CurrentAttempt {
  private constructor(
    public readonly lessonId: string,
    public readonly attemptId: string,
    public readonly courseId: string,
    public readonly status: 'evaluating' | 'approvedExcellent' | 'approvedImprove' | 'rejected',
    public readonly userAnswer: string | object,
    public readonly createdAt: Date,
    public readonly aiFeedback?: {
      score: number;
      feedback: string;
      suggestions?: string;
    }
  ) {}

  static create(data: {
    lessonId: string;
    attemptId: string;
    courseId: string;
    status: 'evaluating' | 'approvedExcellent' | 'approvedImprove' | 'rejected';
    userAnswer: string | object;
    createdAt: Date;
    aiFeedback?: {
      score: number;
      feedback: string;
      suggestions?: string;
    };
  }): CurrentAttempt {
    return new CurrentAttempt(
      data.lessonId,
      data.attemptId,
      data.courseId,
      data.status,
      data.userAnswer,
      data.createdAt,
      data.aiFeedback
    );
  }

  static fromPrimitives(data: CurrentAttemptPrimitives): CurrentAttempt {
    return new CurrentAttempt(
      data.lessonId,
      data.attemptId,
      data.courseId,
      data.status,
      data.userAnswer,
      data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
      data.aiFeedback
    );
  }

  /**
   * Actualiza el intento con la evaluación de la IA
   */
  withEvaluation(evaluation: {
    status: 'approvedExcellent' | 'approvedImprove' | 'rejected';
    score: number;
    feedback: string;
    suggestions?: string;
  }): CurrentAttempt {
    return new CurrentAttempt(
      this.lessonId,
      this.attemptId,
      this.courseId,
      evaluation.status,
      this.userAnswer,
      this.createdAt,
      {
        score: evaluation.score,
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions
      }
    );
  }

  /**
   * Verifica si el intento fue aprobado
   */
  isApproved(): boolean {
    return this.status === 'approvedExcellent' || this.status === 'approvedImprove';
  }

  /**
   * Verifica si el intento está siendo evaluado
   */
  isEvaluating(): boolean {
    return this.status === 'evaluating';
  }

  /**
   * Verifica si el intento fue rechazado
   */
  isRejected(): boolean {
    return this.status === 'rejected';
  }

  /**
   * Obtiene el puntaje del intento (si está disponible)
   */
  getScore(): number | null {
    return this.aiFeedback?.score ?? null;
  }

  toPrimitives(): CurrentAttemptPrimitives {
    return {
      lessonId: this.lessonId,
      attemptId: this.attemptId,
      courseId: this.courseId,
      status: this.status,
      userAnswer: this.userAnswer,
      createdAt: this.createdAt,
      aiFeedback: this.aiFeedback
    };
  }
}

export type CurrentAttemptPrimitives = {
  lessonId: string;
  attemptId: string;
  courseId: string;
  status: 'evaluating' | 'approvedExcellent' | 'approvedImprove' | 'rejected';
  userAnswer: string | object;
  createdAt: Date;
  aiFeedback?: {
    score: number;
    feedback: string;
    suggestions?: string;
  };
};
