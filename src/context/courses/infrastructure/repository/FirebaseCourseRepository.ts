import { firestore } from "../../../../app/config/configureFirebase";
import { Course, CoursePrimitives } from "../../domain/Course";
import { CourseRepository } from "../../domain/CourseRepository";

interface CourseDocument {
  __id: string,
  title: string,
  description: string,
  total_topics: number,
  total_lessons: number,
  created_at: FirebaseFirestore.Timestamp
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

    const data = snapshot.docs[0].data() as CourseDocument;
    return this.toDomainEntity(data);
  }

  async findAll(): Promise<Course[]> {
    const snapshot = await firestore().collection(this.collection).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as CourseDocument;
      return this.toDomainEntity(data);
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
      description: primitives.description,
      total_topics: primitives.totalTopics,
      total_lessons: primitives.totalLessons,
      created_at: FirebaseFirestore.Timestamp.fromDate(primitives.createdAt)
    }
  }

  private toDomainEntity(document: CourseDocument): Course {
    return Course.fromPrimitives({
      id: document.__id,
      title: document.title,
      description: document.description,
      totalTopics: document.total_topics,
      totalLessons: document.total_lessons,
      createdAt: document.created_at.toDate()
    })
  }
}