import { firestore } from "../../../../app/config/configureFirebase";
import { Course, CoursePrimitives } from "../../domain/Course";
import { CourseRepository } from "../../domain/CourseRepository";

interface CourseDocument {
  __id: string,
  title: string,
  description: string
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

  async findByName(title: string): Promise<Course | null> {
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
  
  private toFirestoreDocument(primitives: CoursePrimitives): CourseDocument {
    return {
      __id: primitives.id,
      title: primitives.title,
      description: primitives.description
    }
  }

  private toDomainEntity(document: CourseDocument): Course {
    return Course.fromPrimitives({
      id: document.__id,
      title: document.title,
      description: document.title
    })
  }
}