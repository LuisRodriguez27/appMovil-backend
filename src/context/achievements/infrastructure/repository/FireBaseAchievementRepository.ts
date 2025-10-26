import { firestore } from "../../../../app/config/configureFirebase";
import { AchievementRepository } from "../../domain/AchievementRepository";
import { Achievement , AchievementsPrimitives } from "../../domain/Achievement";

interface AchievementDocument extends Omit<AchievementsPrimitives, 'id'> {
	__id: string
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

	async findByRarity(rarity: string): Promise<Achievement[]> {
  const snapshot = await firestore()
    .collection(this.collection)
    .where('rarity', '==', rarity)
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data() as Omit<AchievementDocument, '__id'>;
    return this.toDomainEntity({
      __id: doc.id,
      ...data
    });
  });
}

	private toFirestoreDocument(achievement: AchievementsPrimitives): AchievementDocument {
		const primitives = achievement;

		// Handle rarity - could be string (RarityType) or Rarity object
		const rarity = typeof primitives.rarity === 'string'
			? primitives.rarity
			: (primitives.rarity as any).value;

		// Handle condition - could be string (ConditionType) or Condition object
		const condition = typeof primitives.condition === 'string'
			? primitives.condition
			: (primitives.condition as any).value;

		return {
			__id: primitives.id,
			title: primitives.title,
			description: primitives.description,
			points: primitives.points,
			rarity: rarity,
			icon: primitives.icon,
			condition: condition,
			createdAt: primitives.createdAt
		};
	}

	private toDomainEntity(doc: AchievementDocument): Achievement {
		return Achievement.fromPrimitives({
			id: doc.__id,
			title: doc.title,
			description: doc.description,
			points: doc.points,
			rarity: doc.rarity,
			icon: doc.icon,
			condition: doc.condition,
			createdAt: doc.createdAt
		});
	}
}