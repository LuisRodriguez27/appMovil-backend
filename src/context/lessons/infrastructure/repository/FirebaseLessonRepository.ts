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

    // Preparar solo los campos actualizables (sin topicId, subtopicId, created_at)
    const updateData: any = {
      title: primitives.title,
      content: primitives.content,
      order: primitives.order,
    };

    // Agregar campos opcionales solo si están definidos
    if (primitives.exerciseConfigs !== undefined) {
      updateData.exercise_configs = primitives.exerciseConfigs;
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
    // Firebase guarda los campos en snake_case
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return this.toDomainEntity(data);
    });
  }

  async findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]> {
    // Firebase guarda los campos en snake_case
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .where('subtopic_id', '==', subtopicId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return this.toDomainEntity(data);
    });
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    const topicsSnapshot = await firestore()
      .collection('topics')
      .where('courseId', '==', courseId)
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
      // Firebase guarda los campos en snake_case
      const snapshot = await firestore()
        .collection(this.collection)
        .where('topic_id', 'in', batch)
        .get();

      const batchLessons = snapshot.docs.map((doc) => {
        const data = doc.data();
        return this.toDomainEntity(data);
      });

      lessons.push(...batchLessons);
    }

    return lessons;
  }

  async findFinalLessonByTopicId(topicId: string): Promise<Lesson | null> {
    // Firebase guarda los campos en snake_case
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .where('subtopic_id', '==', null)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data();
    return this.toDomainEntity(data);
  }

  async delete(id: string): Promise<void> {
    await firestore().collection(this.collection).doc(id).delete();
  }

  async deleteBySubtopicId(subtopicId: string): Promise<void> {
    // Firebase guarda los campos en snake_case
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

  async deleteByTopicId(topicId: string): Promise<void> {
    // Firebase guarda los campos en snake_case
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .get();

    const batch = firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  private toFirestoreDocument(lesson: LessonPrimitives): LessonDocument {
    const primitives = lesson;

    // Guardar en snake_case para mantener consistencia con Firebase
    const document: any = {
      __id: primitives.id,
      topic_id: primitives.topicId,
      subtopic_id: primitives.subtopicId,
      title: primitives.title,
      content: primitives.content,
      order: primitives.order, // Añadido
      created_at: Timestamp.fromDate(primitives.createdAt),
      ...(primitives.exerciseConfigs !== undefined ? { exercise_configs: primitives.exerciseConfigs } : {}),
      ...(primitives.description !== undefined ? { description: primitives.description } : {})
    };

    return document;
  }

  private toDomainEntity(document: any): Lesson {
    // Firebase guarda los campos en snake_case, necesitamos mapearlos a camelCase
    const createdAtTimestamp = document.createdAt || document.created_at;
    const createdAtDate = createdAtTimestamp && typeof createdAtTimestamp.toDate === 'function' 
      ? createdAtTimestamp.toDate() 
      : new Date();

    // Soporte para estructura antigua (exerciseConfig singular) y nueva (exerciseConfigs array)
    let exerciseConfigs = document.exerciseConfigs || document.exercise_configs || [];
    if (exerciseConfigs.length === 0 && (document.exerciseConfig || document.exercise_config)) {
      const singleConfig = document.exerciseConfig || document.exercise_config;
      exerciseConfigs = [singleConfig];
    }

    const data = {
      id: document.__id || document.id,
      topicId: document.topicId || document.topic_id,
      subtopicId: document.subtopicId || document.subtopic_id,
      title: document.title,
      content: document.content,
      order: document.order ?? 0, // Añadido
      exerciseConfigs: exerciseConfigs,
      description: document.description,
      createdAt: createdAtDate
    };

    return Lesson.fromPrimitives(data);
  }
}
