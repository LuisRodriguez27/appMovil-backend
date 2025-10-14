import { User, UserPrimitives, UserPreferences } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { firestore } from '../../../../app/config/configureFirebase';

interface UserDocument {
  __id: string;
  numero_control: string;
  name: string;
  email: string;
  carrera: string;
  semestre: number;
  xp: number;
  level: number;
  streak: number;
  current_course: string | null;
  learning_style: string | null;
  profile_picture: string | null;
  preferences: UserPreferences;
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

  async findByNumeroControl(numeroControl: string): Promise<User | null> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('numero_control', '==', numeroControl)
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

  async updateStreak(id: string, newStreak: number): Promise<void> {
    await firestore().collection(this.collection).doc(id).update({
      streak: newStreak,
    });
  }

  private toFirestoreDocument(primitives: UserPrimitives): UserDocument {
    return {
      __id: primitives.id,
      numero_control: primitives.numeroControl,
      name: primitives.name,
      email: primitives.email,
      carrera: primitives.carrera,
      semestre: primitives.semestre,
      xp: primitives.xp,
      level: primitives.level,
      streak: primitives.streak,
      current_course: primitives.currentCourse,
      learning_style: primitives.learningStyle,
      profile_picture: primitives.profilePicture,
      preferences: primitives.preferences,
    };
  }

  private toDomainEntity(document: UserDocument): User {
    return User.fromPrimitives({
      id: document.__id,
      numeroControl: document.numero_control,
      name: document.name,
      email: document.email,
      carrera: document.carrera,
      semestre: document.semestre,
      xp: document.xp,
      level: document.level,
      streak: document.streak,
      currentCourse: document.current_course,
      learningStyle: document.learning_style,
      profilePicture: document.profile_picture,
      preferences: document.preferences,
    });
  }
}
