import { User, UserPrimitives } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { firestore } from '../../../../app/config/configureFirebase';

interface UserDocument extends Omit<UserPrimitives, 'id'> {
  __id: string;
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

  async findByNumeroControl(controlNumber: string): Promise<User | null> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('control_number', '==', controlNumber)
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

    await firestore().collection(this.collection).doc(__id).update(updateData);
  }

  async delete(id: string): Promise<void> {
    await firestore().collection(this.collection).doc(id).delete();
  }

  async updateXP(id: string, xpToAdd: number): Promise<void> {
    const userRef = firestore().collection(this.collection).doc(id);
    const doc = await userRef.get();

    if (!doc.exists) {
      throw new Error('Usuario no encontrado');
    }

    const data = doc.data() as UserDocument;
    const newXP = data.xp + xpToAdd;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    await userRef.update({
      xp: newXP,
      level: newLevel,
    });
  }

  private toFirestoreDocument(primitives: UserPrimitives): UserDocument {
    return {
      __id: primitives.id,
      controlNumber: primitives.controlNumber,
      name: primitives.name,
      email: primitives.email,
      role: primitives.role,
      xp: primitives.xp,
      level: primitives.level,
      currentCourse: primitives.currentCourse,
      profilePicture: primitives.profilePicture,
      progress: primitives.progress,
      achievements: primitives.achievements,
      streakData: primitives.streakData,
      stats: primitives.stats,
      createdAt: primitives.createdAt,
    };
  }

  private toDomainEntity(document: UserDocument): User {
    return User.fromPrimitives({
      id: document.__id,
      controlNumber: document.controlNumber,
      name: document.name,
      email: document.email,
      role: document.role || 'student',
      xp: document.xp,
      level: document.level,
      currentCourse: document.currentCourse,
      profilePicture: document.profilePicture,
      progress: document.progress || {},
      achievements: document.achievements || [],
      streakData: document.streakData || {
        current_streak: 0,
        best_streak: 0,
        last_study_date: '',
      },
      stats: document.stats || {
        total_lessons_completed: 0,
        total_exercises_completed: 0,
        total_courses_completed: 0,
      },
      createdAt: document.createdAt,
    });
  }
}
