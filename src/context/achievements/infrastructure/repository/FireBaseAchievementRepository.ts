import { firestore } from "../../../../app/config/configureFirebase";
import { AchievementRepository } from "../../domain/AchievementRepository";
import { Achievement , AchievementsPrimitives } from "../../domain/Achievement";

interface AchievementDocument {
	__id: string,
	title: string,
	description: string,
	points: number,
	rarity: string,
	icon: string,
	condition: { type: string; value: number | string }
}

export class FireBaseAchievementRepository implements AchievementRepository {
	private readonly collection = 'achievements';

	async create(achievement: Achievement): Promise<void> {
		const primitives = achievement.toPrimitives();
		const document = this.toFirestoreDocument(primitives);

		await firestore().collection(this.collection).doc(document.__id).set(document);
	}
		
	async findById(id: string): Promise<Achievement | null> {
		const doc = await firestore().collection(this.collection).doc(id).get();

		if (!doc.exists) {
			return null;
		}

		const data = doc.data() as AchievementDocument;
		return this.toDomainEntity(data);
	}

	async findAll(): Promise<Achievement []> {
		const doc = await firestore().collection(this.collection).get();

		return doc.docs.map(doc => {
			const data = doc.data() as Omit<AchievementDocument, '__id'>;
			return this.toDomainEntity({
				__id: doc.id,
				...data
			});
		});
	}

	async update(achievement: Achievement ): Promise<void> {
		const primitives = achievement.toPrimitives();
		const document = this.toFirestoreDocument(primitives);
		const { __id, ...data } = document;

		await firestore().collection(this.collection).doc(__id).update(data);
	}

	async delete(id: string): Promise<void> {
		await firestore().collection(this.collection).doc(id).delete();
	}

	private toFirestoreDocument(achievement: AchievementsPrimitives): AchievementDocument {
		return {
			__id: achievement.id,
			title: achievement.title,
			description: achievement.description,
			points: achievement.points,
			rarity: achievement.rarity,
			icon: achievement.icon,
			condition: {
				type: achievement.condition.type,
				value: achievement.condition.value,
			}
		};
	}

	private toDomainEntity(doc: AchievementDocument): Achievement {
		return new Achievement (
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