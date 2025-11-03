import { firestore } from "../../../../app/config/configureFirebase";
import { Topic, TopicPrimitives } from "../../domain/Topic";
import { TopicRepository } from "../../domain/TopicRepository";

interface TopicDocument extends Omit<TopicPrimitives, 'id' > {
  __id: string;
}

export class FirebaseTopicRepository implements TopicRepository {
  private readonly collection = 'topics';

  async create(topic: Topic): Promise<void> {
    const primitives = topic.toPrimitives();
    const document = this.toFirestoreDocument(primitives);

    await firestore().collection(this.collection).doc(document.__id).set(document);
  }

  async findById(id: string): Promise<Topic | null> {
    const doc = await firestore().collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as TopicDocument;
    return this.toDomainEntity(data);
  }

  async findByCourseId(courseId: string): Promise<Topic[]> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('course_id', '==', courseId)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as TopicDocument;
      return this.toDomainEntity(data);
    });
  }

  async findAll(): Promise<Topic[]> {
    const snapshot = await firestore().collection(this.collection).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as TopicDocument;
      return this.toDomainEntity(data);
    });
  }

  async update(topic: Topic): Promise<void> {
    const primitives = topic.toPrimitives();
    const document = this.toFirestoreDocument(primitives);
    const { __id, ...data } = document;

    await firestore().collection(this.collection).doc(__id).update(data);
  }

  async delete(id: string): Promise<void> {
    await firestore().collection(this.collection).doc(id).delete();
  }

  async deleteAllByCourseId(courseId: string): Promise<void> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('course_id', '==', courseId)
      .get();

    // Eliminar todos los topics del curso en batch
    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  private toFirestoreDocument(primitives: TopicPrimitives): TopicDocument {
    return {
      __id: primitives.id,
      courseId: primitives.courseId,
      title: primitives.title,
      order: primitives.order,
      createdAt: primitives.createdAt,
      ...(primitives.description !== undefined ? { description: primitives.description } : {})
    };
  }

  private toDomainEntity(document: TopicDocument): Topic {
    return Topic.fromPrimitives({
      id: document.__id,
      courseId: document.courseId,
      title: document.title,
      order: document.order,
      description: document.description,
      createdAt: document.createdAt
    });
  }
}
