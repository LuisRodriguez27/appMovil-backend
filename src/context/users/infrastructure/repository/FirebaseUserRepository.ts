import { User, UserPrimitives } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { CurrentAttempt } from '../../domain/value-objects/CurrentAttempt';
import { firestore, firebaseAuth } from '../../../../app/config/configureFirebase';
import { FieldValue } from 'firebase-admin/firestore';

interface UserDocument extends Omit<UserPrimitives, 'createdAt'> {
  createdAt: string | Date | { toDate: () => Date };
}

export class FirebaseUserRepository implements UserRepository {
  private readonly collection = 'users';

  async create(user: User): Promise<void> {
    const primitives = user.toPrimitives();
    const document = this.toFirestoreDocument(primitives);

    await firestore().collection(this.collection).doc(document.__id).set(document);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await firestore().collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as UserDocument;
    return this.toDomainEntity(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data() as UserDocument;
    return this.toDomainEntity(data);
  }

  async findAll(): Promise<User[]> {
    const snapshot = await firestore().collection(this.collection).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as UserDocument;
      return this.toDomainEntity(data);
    });
  }

  async update(user: User): Promise<void> {
    const primitives = user.toPrimitives();
    const document = this.toFirestoreDocument(primitives);
    const { __id, ...updateData } = document;

    // Usar set con merge: true para manejar campos opcionales correctamente
    await firestore().collection(this.collection).doc(__id).set(updateData, { merge: true });
  }

  async delete(id: string): Promise<void> {
    // Eliminar de Firebase Authentication primero
    try {
      await firebaseAuth().deleteUser(id);
    } catch (error) {
      // Si el usuario no existe en Auth, continuar con la eliminación de Firestore
      console.warn(`Usuario ${id} no encontrado en Firebase Auth, continuando con eliminación de Firestore`);
    }

    // Eliminar de Firestore
    await firestore().collection(this.collection).doc(id).delete();
  }

  async updateXP(id: string, xpToAdd: number): Promise<void> {
    const userRef = firestore().collection(this.collection).doc(id);

    await userRef.update({
      xp: FieldValue.increment(xpToAdd),
    });
  }

  private toFirestoreDocument(primitives: UserPrimitives): UserDocument {
    const document: any = {
      __id: primitives.__id,
      name: primitives.name,
      email: primitives.email,
      role: primitives.role,
      xp: primitives.xp,
      progress: primitives.progress,
      achievements: primitives.achievements,
      streakData: primitives.streakData,
      stats: primitives.stats,
      createdAt: primitives.createdAt,
    };

    // Solo agregar campos opcionales si tienen valor
    if (primitives.currentCourseId !== undefined) {
      document.currentCourseId = primitives.currentCourseId;
    }
    if (primitives.profilePicture !== undefined) {
      document.profilePicture = primitives.profilePicture;
    }
    if (primitives.currentAttempt !== undefined) {
      document.currentAttempt = primitives.currentAttempt;
    }

    return document;
  }

  private toDomainEntity(document: UserDocument): User {
    let createdAt = new Date();

    if (document.createdAt) {
      if (typeof document.createdAt === 'string') {
        createdAt = new Date(document.createdAt);
      } else if (document.createdAt instanceof Date) {
        createdAt = document.createdAt;
      } else if (typeof (document.createdAt as any).toDate === 'function') {
        // Handle Firestore Timestamp
        createdAt = (document.createdAt as any).toDate();
      }
    }

    return User.fromPrimitives({
      __id: document.__id,
      name: document.name,
      email: document.email,
      role: document.role || 'student',
      xp: document.xp,
      currentCourseId: document.currentCourseId,
      profilePicture: document.profilePicture,
      progress: document.progress || {},
      achievements: document.achievements || [],
      streakData: document.streakData || {
        currentStreak: 0,
        bestStreak: 0,
        lastStudyDate: null,
      },
      stats: document.stats || {
        totalLessonsCompleted: 0,
        totalExercisesCompleted: 0,
        totalCoursesCompleted: 0,
      },
      currentAttempt: document.currentAttempt,
      createdAt: createdAt.toISOString(),
    });
  }

  async createAttempt(userId: string, attempt: CurrentAttempt): Promise<void> {
    const userRef = firestore().collection(this.collection).doc(userId);

    const primitives = attempt.toPrimitives();

    await userRef.set({
      currentAttempt: {
        lessonId: primitives.lessonId,
        attemptId: primitives.attemptId,
        courseId: primitives.courseId,
        status: primitives.status,
        userAnswer: primitives.userAnswer,
        createdAt: FieldValue.serverTimestamp(),
        aiFeedback: primitives.aiFeedback
      }
    }, { merge: true });
  }

  async updateAttemptWithEvaluation(
    userId: string,
    attemptId: string,
    evaluation: {
      status: CurrentAttempt['status'];
      score: number;
      feedback: string;
      suggestions?: string;
    }
  ): Promise<void> {
    const userRef = firestore().collection(this.collection).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`Usuario ${userId} no encontrado`);
    }

    const userData = userDoc.data();
    const currentAttempt = userData?.currentAttempt;

    if (!currentAttempt || currentAttempt.attemptId !== attemptId) {
      throw new Error(`Intento ${attemptId} no encontrado para el usuario ${userId}`);
    }

    // Preparar la actualización
    const updateData: any = {
      currentAttempt: {
        ...currentAttempt,
        status: evaluation.status,
        aiFeedback: {
          score: evaluation.score,
          feedback: evaluation.feedback,
          suggestions: evaluation.suggestions
        }
      }
    };

    // Si fue aprobado, actualizar progreso y estadísticas
    if (evaluation.status === 'approvedExcellent' || evaluation.status === 'approvedImprove') {
      const courseId = currentAttempt.courseId;
      const lessonId = currentAttempt.lessonId;

      // Actualizar progreso
      updateData[`progress.${courseId}.lastLessonCompletedId`] = lessonId;
      updateData[`progress.${courseId}.completedCount`] = FieldValue.increment(1);

      // Actualizar estadísticas
      updateData['stats.totalLessonsCompleted'] = FieldValue.increment(1);
      updateData['stats.totalExercisesCompleted'] = FieldValue.increment(1);

      // Agregar XP (score / 2)
      const xpToAdd = Math.floor(evaluation.score / 2);
      updateData.xp = FieldValue.increment(xpToAdd);
    }

    await userRef.set(updateData, { merge: true });
  }

  async getCurrentAttempt(userId: string): Promise<CurrentAttempt | null> {
    const userDoc = await firestore().collection(this.collection).doc(userId).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data();
    const currentAttempt = userData?.currentAttempt;

    if (!currentAttempt) {
      return null;
    }

    return CurrentAttempt.fromPrimitives({
      lessonId: currentAttempt.lessonId,
      attemptId: currentAttempt.attemptId,
      courseId: currentAttempt.courseId,
      status: currentAttempt.status,
      userAnswer: currentAttempt.userAnswer,
      createdAt: currentAttempt.createdAt?.toDate() || new Date(),
      aiFeedback: currentAttempt.aiFeedback ? {
        score: currentAttempt.aiFeedback.score,
        feedback: currentAttempt.aiFeedback.feedback,
        suggestions: currentAttempt.aiFeedback.suggestions
      } : undefined
    });
  }
}
