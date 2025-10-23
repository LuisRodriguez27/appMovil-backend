import { firestore } from "../../../../app/config/configureFirebase";
import { ArchivementRepository } from "../../domain/ArchivementRepository";
import { Archivement, ArchivementsPrimitives } from "../../domain/Archivement";

interface ArchivementDocument {
	__id: string,
	title: string,
	description: string,
	points: number,
	rarity: string,
	icon: string,
	condition: { type: string; value: number | string }
}

export class FireBaseArchivementRepository implements ArchivementRepository {
	private readonly collection = 'archivements';

	async create(archivement: Archivement): Promise<void> {
		const primitives = archivement.toPrimitives();
		const document = this.toFirestoreDocument(primitives);

		await firestore().collection(this.collection).doc(document.__id).set(document);
	}
		
	async findById(id: string): Promise<Archivement | null> {
		const doc = await firestore().collection(this.collection).doc(id).get();

		if (!doc.exists) {
			return null;
		}

		const data = doc.data() as ArchivementDocument;
		return this.toDomainEntity(data);
	}

	async findAll(): Promise<Archivement[]> {
		const doc = await firestore().collection(this.collection).get();

		return doc.docs.map(doc => {
			const data = doc.data() as Omit<ArchivementDocument, '__id'>;
			return this.toDomainEntity({
				__id: doc.id,
				...data
			});
		});
	}

	async update(archivement: Archivement): Promise<void> {
		const primitives = archivement.toPrimitives();
		const document = this.toFirestoreDocument(primitives);
		const { __id, ...data } = document;

		await firestore().collection(this.collection).doc(__id).update(data);
	}

	async delete(id: string): Promise<void> {
		await firestore().collection(this.collection).doc(id).delete();
	}

	private toFirestoreDocument(archivement: ArchivementsPrimitives): ArchivementDocument {
		return {
			__id: archivement.id,
			title: archivement.title,
			description: archivement.description,
			points: archivement.points,
			rarity: archivement.rarity,
			icon: archivement.icon,
			condition: {
				type: archivement.condition.type,
				value: archivement.condition.value,
			}
		};
	}

	private toDomainEntity(doc: ArchivementDocument): Archivement {
		return new Archivement(
			doc.__id,
			doc.title,
			doc.description,
			doc.points,
			doc.rarity,
			doc.icon,
			doc.condition
		);
	}
}