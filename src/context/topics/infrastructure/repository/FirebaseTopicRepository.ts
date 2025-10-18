import { firestore } from "../../../../app/config/configureFirebase";
import { Topic, TopicPrimitives, Subtopic } from "../../domain/Topic";
import { TopicRepository } from "../../domain/TopicRepository";

interface TopicDocument {
  __id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  subtopics: Subtopic[];
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

  private toFirestoreDocument(primitives: TopicPrimitives): TopicDocument {
    return {
      __id: primitives.id,
      course_id: primitives.courseId,
      title: primitives.title,
      description: primitives.description,
      order: primitives.order,
      subtopics: primitives.subtopics
    };
  }

  private toDomainEntity(document: TopicDocument): Topic {
    return Topic.fromPrimitives({
      id: document.__id,
      courseId: document.course_id,
      title: document.title,
      description: document.description,
      order: document.order,
      subtopics: document.subtopics
    });
  }
}
