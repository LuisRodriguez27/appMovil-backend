import { firestore } from "../../../../app/config/configureFirebase";
import { Lesson, LessonPrimitives} from "../../domain/Lesson";
import { LessonRepository } from "../../domain/LessonRepository";
import { Timestamp } from "firebase-admin/firestore";

interface LessonDocument extends Omit<LessonPrimitives, 'id'> {
  __id: string;
}

export class FirebaseLessonRepository implements LessonRepository {
  private readonly collection = 'lessons';

  async create(lesson: Lesson): Promise<void> {
    const primitives = lesson.toPrimitives();
    const document = this.toFirestoreDocument(primitives);

    await firestore().collection(this.collection).doc(document.__id).set(document);
  }
  
  async update(lesson: Lesson): Promise<void> {
    const primitives = lesson.toPrimitives();

    // Preparar solo los campos actualizables (sin topic_id, subtopic_id, created_at)
    const updateData: any = {
      title: primitives.title,
      content: primitives.content,
    };

    // Agregar campos opcionales solo si están definidos
    if (primitives.exerciseConfig !== undefined) {
      updateData.exerciseConfig = primitives.exerciseConfig;
    }

    if (primitives.description !== undefined) {
      updateData.description = primitives.description;
    }

    await firestore().collection(this.collection).doc(primitives.id).update(updateData);
  }

  async findAll(): Promise<Lesson[]> {
    const snapshot = await firestore().collection(this.collection).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as LessonDocument;
      return this.toDomainEntity(data);
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    const doc = await firestore().collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as LessonDocument;
    return this.toDomainEntity(data);
  }

  async findByTopicId(topicId: string): Promise<Lesson[]> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as LessonDocument;
      return this.toDomainEntity(data);
    });
  }

  async findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .where('subtopic_id', '==', subtopicId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as LessonDocument;
      return this.toDomainEntity(data);
    });
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    const topicsSnapshot = await firestore()
      .collection('topics')
      .where('course_id', '==', courseId)
      .get();

    const topicIds = topicsSnapshot.docs.map(doc => doc.id);

    if (topicIds.length === 0) {
      return [];
    }

    // Firestore tiene límite de 10 items en 'in', así que si hay más, hacer batch
    const lessons: Lesson[] = [];
    const batchSize = 10;

    for (let i = 0; i < topicIds.length; i += batchSize) {
      const batch = topicIds.slice(i, i + batchSize);
      const snapshot = await firestore()
        .collection(this.collection)
        .where('topic_id', 'in', batch)
        .get();

      const batchLessons = snapshot.docs.map((doc) => {
        const data = doc.data() as LessonDocument;
        return this.toDomainEntity(data);
      });

      lessons.push(...batchLessons);
    }

    return lessons;
  }

  async findFinalLessonByTopicId(topicId: string): Promise<Lesson | null> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .where('subtopic_id', '==', null)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data() as LessonDocument;
    return this.toDomainEntity(data);
  }

  async delete(id: string): Promise<void> {
    await firestore().collection(this.collection).doc(id).delete();
  }

  async deleteBySubtopicId(subtopicId: string): Promise<void> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('subtopic_id', '==', subtopicId)
      .get();

    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  private toFirestoreDocument(lesson: LessonPrimitives): LessonDocument {
    const primitives = lesson;

    const exerciseConfig = primitives.exerciseConfig !== undefined && 'toPrimitives' in primitives.exerciseConfig
      ? primitives.exerciseConfig.toPrimitives()
      : primitives.exerciseConfig;

    const document: any = {
      __id: primitives.id,
      topic_id: primitives.topicId,
      subtopic_id: primitives.subtopicId,
      title: primitives.title,
      content: primitives.content,
      created_at: Timestamp.fromDate(primitives.createdAt),
      ...(exerciseConfig !== undefined ? { exerciseConfig: exerciseConfig } : {}),
      ...(primitives.description !== undefined ? { description: primitives.description } : {})
    };

    return document;
  }

  private toDomainEntity(document: LessonDocument): Lesson {
    return Lesson.fromPrimitives({
      id: document.__id,
      topicId: document.topicId,
      subtopicId: document.subtopicId,
      title: document.title,
      content: document.content,
      exerciseConfig: document.exerciseConfig,
      description: document.description,
      createdAt: document.createdAt
    });
  }
}
