import { firestore } from "../../../../app/config/configureFirebase";
import { Subtopic, SubtopicPrimitives } from "../../domain/Subtopic";
import { SubtopicRepository } from "../../domain/SubtopicRepository";

interface SubtopicDocument extends Omit<SubtopicPrimitives, 'id'> {
	__id: string;
}

export class FireBaseSubtopicRepository implements SubtopicRepository {
	private readonly collection = 'subtopics';

	async create(subtopic: Subtopic): Promise<void> {
		const primitives = subtopic.toPrimitives();
		const document = this.toFirestoreDocument(primitives);

		await firestore().collection(this.collection).doc(document.__id).set(document);
	}
	
	async findAll(): Promise<Subtopic[]> {
		const doc = await firestore().collection(this.collection).get();

		return doc.docs.map((doc) => {
			const data = doc.data() as SubtopicDocument;
			return this.toDomainEntity(data);
		});
	}

	async findById(id: string): Promise<Subtopic | null> {
		const doc = await firestore().collection(this.collection).doc(id).get();

		if (!doc.exists) {
			return null;
		}

		const data = doc.data() as SubtopicDocument;
		return this.toDomainEntity(data);
	}

	async findByTopicId(topicId: string): Promise<Subtopic[]> {
		const snapshot = await firestore()
			.collection(this.collection)
			.where('topicId', '==', topicId)
			.get();

		if (snapshot.empty) {
			return [];
		}

		return snapshot.docs.map(doc => {
			const data = doc.data() as SubtopicDocument;
			return this.toDomainEntity(data);
		});
	}

	async update(subtopic: Subtopic): Promise<void> {
		const primitives = subtopic.toPrimitives();
    const document = this.toFirestoreDocument(primitives);
    const { __id, ...data } = document;

    await firestore().collection(this.collection).doc(__id).update(data);
	}

	async delete(id: string): Promise<void> {
		await firestore().collection(this.collection).doc(id).delete();
	}

	async deleteByTopicId(topicId: string): Promise<void> {
		const snapshot = await firestore()
			.collection(this.collection)
			.where('topicId', '==', topicId)
			.get();

		const batch = firestore().batch();
		snapshot.docs.forEach((doc) => {
			batch.delete(doc.ref);
		});

		await batch.commit();
	}

	private toFirestoreDocument(primitives: SubtopicPrimitives): SubtopicDocument {
		return {
			__id: primitives.id,
			topicId: primitives.topicId,
			title: primitives.title,
			order: primitives.order,
			createdAt: primitives.createdAt,
			...(primitives.description !== undefined ? { description: primitives.description } : {})
		};
	}

	private toDomainEntity(data: SubtopicDocument): Subtopic {
		return Subtopic.fromPrimitives({
			id: data.__id,
			topicId: data.topicId,
			title: data.title,
			order: data.order,
			description: data.description,
			createdAt: data.createdAt
		});
	}
}	