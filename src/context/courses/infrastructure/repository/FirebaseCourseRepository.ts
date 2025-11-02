import { firestore } from "../../../../app/config/configureFirebase";
import { Course, CoursePrimitives } from "../../domain/Course";
import { CourseRepository } from "../../domain/CourseRepository";

interface CourseDocument extends Omit<CoursePrimitives, 'id' > {
  __id: string
}

export class FirebaseCourseRepository implements CourseRepository {
  private readonly collection = 'courses';

  async create(course: Course): Promise<void> {
    const primitives = course.toPrimitives();
    const document = this.toFirestoreDocument(primitives);

    await firestore().collection(this.collection).doc(document.__id).set(document);
  }

  async findById(id: string): Promise<Course | null> {
    const doc = await firestore().collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as CourseDocument;
    return this.toDomainEntity(data);
  }

  async findByTitle(title: string): Promise<Course | null> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('title', '==', title)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as Omit<CourseDocument, '__id'>;
    return this.toDomainEntity({
      __id: doc.id,  // Usar el ID del documento de Firestore
      ...data
    });
  }

  async findAll(): Promise<Course[]> {
    const doc = await firestore().collection(this.collection).get();

    return doc.docs.map((doc) => {
      const data = doc.data() as Omit<CourseDocument, '__id'>;
      return this.toDomainEntity({
        __id: doc.id,  // Usar el ID del documento de Firestore
        ...data
      });
    });
  }

  async update(course: Course): Promise<void> {
    const primitives = course.toPrimitives();
    const document = this.toFirestoreDocument(primitives);
    const { __id, ...data } = document;

    await firestore().collection(this.collection).doc(__id).update(data);
  }

  async delete(id: string): Promise<void> {
    await firestore().collection(this.collection).doc(id).delete();
  }

  async updateCounters(id: string, totalTopics?: number, totalLessons?: number): Promise<void> {
    const updateData: any = {};

    if (totalTopics !== undefined) {
      updateData.total_topics = totalTopics;
    }

    if (totalLessons !== undefined) {
      updateData.total_lessons = totalLessons;
    }

    if (Object.keys(updateData).length > 0) {
      await firestore().collection(this.collection).doc(id).update(updateData);
    }
  }

  private toFirestoreDocument(primitives: CoursePrimitives): CourseDocument {
    return {
      __id: primitives.id,
      title: primitives.title,
      totalTopics: primitives.totalTopics,
      totalLessons: primitives.totalLessons,
      description: primitives.description,
      createdAt: primitives.createdAt
    }
  }

  private toDomainEntity(document: CourseDocument): Course {
    return Course.fromPrimitives({
      id: document.__id,
      title: document.title,
      description: document.description,
      totalTopics: document.totalTopics,
      totalLessons: document.totalLessons,
      createdAt: document.createdAt
    })
  }
}