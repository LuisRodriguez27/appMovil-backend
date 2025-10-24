import { firestore } from "../../../../app/config/configureFirebase";
import { Lesson, LessonPrimitives, Exercise } from "../../domain/Lesson";
import { LessonRepository } from "../../domain/LessonRepository";
import { Timestamp } from "firebase-admin/firestore";

interface LessonDocument {
  __id: string;
  topic_id: string;
  subtopic_id: string;
  title: string;
  description: string;
  content: string;
  order: number;
  estimated_time: number;
  difficulty: 'easy' | 'medium' | 'hard';
  exercises: Exercise[];
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

export class FirebaseLessonRepository implements LessonRepository {
  private readonly collection = 'lessons';

  async findById(id: string): Promise<Lesson | null> {
    const doc = await firestore().collection(this.collection).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as LessonDocument;
    return this.toDomainEntity(data);
  }

  async findBySubtopicId(topicId: string, subtopicId: string): Promise<Lesson[]> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .where('subtopic_id', '==', subtopicId)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as LessonDocument;
      return this.toDomainEntity(data);
    });
  }

  async countBySubtopicId(subtopicId: string): Promise<number> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('subtopic_id', '==', subtopicId)
      .get();

    return snapshot.size;
  }

  async findByTopicId(topicId: string): Promise<Lesson[]> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .orderBy('order', 'asc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as LessonDocument;
      return this.toDomainEntity(data);
    });
  }

  async countByTopicId(topicId: string): Promise<number> {
    const snapshot = await firestore()
      .collection(this.collection)
      .where('topic_id', '==', topicId)
      .get();

    return snapshot.size;
  }

  async findAll(): Promise<Lesson[]> {
    const snapshot = await firestore().collection(this.collection).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as LessonDocument;
      return this.toDomainEntity(data);
    });
  }

  async findByCourseId(courseId: string): Promise<Lesson[]> {
    // Para obtener lecciones por curso, necesitamos hacer join con topics
    // Primero obtenemos todos los topics del curso
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
        .orderBy('order', 'asc')
        .get();

      const batchLessons = snapshot.docs.map((doc) => {
        const data = doc.data() as LessonDocument;
        return this.toDomainEntity(data);
      });

      lessons.push(...batchLessons);
    }

    return lessons;
  }

  async findPublishedByCourseId(courseId: string): Promise<Lesson[]> {
    // Por ahora, todas las lecciones se consideran publicadas
    // Si en el futuro se agrega un campo 'published', modificar aquí
    return this.findByCourseId(courseId);
  }

  async save(lesson: Lesson): Promise<void> {
    const primitives = lesson.toPrimitives();
    const document = this.toFirestoreDocument(primitives);

    await firestore().collection(this.collection).doc(document.__id).set(document);
  }

  async update(lesson: Lesson): Promise<void> {
    const primitives = lesson.toPrimitives();
    const document = this.toFirestoreDocument(primitives);
    const { __id, ...data } = document;

    await firestore().collection(this.collection).doc(__id).update(data);
  }

  async delete(id: string): Promise<void> {
    await firestore().collection(this.collection).doc(id).delete();
  }

  async existsById(id: string): Promise<boolean> {
    const doc = await firestore().collection(this.collection).doc(id).get();
    return doc.exists;
  }

  private toFirestoreDocument(primitives: LessonPrimitives): LessonDocument {
    return {
      __id: primitives.id,
      topic_id: primitives.topic_id,
      subtopic_id: primitives.subtopic_id,
      title: primitives.title,
      description: primitives.description,
      content: primitives.content,
      order: primitives.order,
      estimated_time: primitives.estimated_time,
      difficulty: primitives.difficulty,
      exercises: primitives.exercises,
      created_at: Timestamp.fromDate(primitives.created_at),
      updated_at: Timestamp.fromDate(primitives.updated_at)
    };
  }

  private toDomainEntity(document: LessonDocument): Lesson {
    return Lesson.fromPrimitives({
      id: document.__id,
      topic_id: document.topic_id,
      subtopic_id: document.subtopic_id,
      title: document.title,
      description: document.description,
      content: document.content,
      order: document.order,
      estimated_time: document.estimated_time,
      difficulty: document.difficulty,
      exercises: document.exercises,
      created_at: document.created_at.toDate(),
      updated_at: document.updated_at.toDate()
    });
  }
}
