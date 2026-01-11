import { getDb } from '$lib/server/db.js';

export async function getStorageLocations() {
	const db = await getDb();
	const col = db.collection('storageLocations');

	// falls leer: Standard anlegen (so wie bei /lagerorte)
	const count = await col.countDocuments();
	if (count === 0) {
		await col.insertMany([
			{ name: 'Kühlschrank', order: 1, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Vorratsschrank', order: 2, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Tiefkühler', order: 3, createdAt: new Date(), updatedAt: new Date() }
		]);
	}

	const docs = await col.find({}).sort({ order: 1, name: 1 }).toArray();
	return docs.map((l) => ({ id: l._id.toString(), name: l.name, order: l.order ?? 999 }));
}
