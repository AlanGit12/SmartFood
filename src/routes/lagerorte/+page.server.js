import { getDb } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';

function normName(s) {
	return String(s || '').trim();
}

export async function load() {
	const db = await getDb();

	// falls leer, initialisieren wir Standardorte (optional aber praktisch)
	const col = db.collection('storageLocations');
	const count = await col.countDocuments();

	if (count === 0) {
		await col.insertMany([
			{ name: 'Kühlschrank', order: 1, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Vorratsschrank', order: 2, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Tiefkühler', order: 3, createdAt: new Date(), updatedAt: new Date() }
		]);
	}

	const locations = await col.find({}).sort({ order: 1, name: 1 }).toArray();

	return {
		locations: locations.map((l) => ({
			id: l._id.toString(),
			name: l.name,
			order: l.order ?? 999
		}))
	};
}

export const actions = {
	add: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();

		const name = normName(fd.get('name'));
		if (!name) return fail(400, { message: 'Name fehlt.' });

		const col = db.collection('storageLocations');

		const exists = await col.findOne({ name });
		if (exists) return fail(400, { message: 'Dieser Lagerort existiert bereits.' });

		// nächstes order
		const last = await col.find({}).sort({ order: -1 }).limit(1).toArray();
		const nextOrder = (last[0]?.order ?? 0) + 1;

		await col.insertOne({
			name,
			order: nextOrder,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		throw redirect(303, '/lagerorte');
	},

rename: async ({ request }) => {
	const db = await getDb();
	const fd = await request.formData();

	const id = String(fd.get('id') || '');
	const name = normName(fd.get('name'));

	if (!id) return fail(400, { message: 'ID fehlt.' });
	if (!name) return fail(400, { message: 'Name fehlt.' });

	let _id;
	try {
		_id = new ObjectId(id);
	} catch {
		return fail(400, { message: 'Ungültige ID.' });
	}

	const col = db.collection('storageLocations');

	// ✅ alten Namen VOR dem Update holen (wichtig!)
	const oldDoc = await col.findOne({ _id });
	if (!oldDoc) return fail(404, { message: 'Lagerort nicht gefunden.' });

	const oldName = oldDoc.name;

	// duplicate name verhindern (außer es ist derselbe Datensatz)
	const exists = await col.findOne({ name, _id: { $ne: _id } });
	if (exists) return fail(400, { message: 'Dieser Name wird bereits verwendet.' });

	// 1) storageLocations umbenennen
	await col.updateOne({ _id }, { $set: { name, updatedAt: new Date() } });

	// 2) Produkte mitziehen (weil storageLocation bei dir ein String ist)
	await db.collection('products').updateMany(
		{ storageLocation: oldName },
		{ $set: { storageLocation: name, updatedAt: new Date() } }
	);

	// 3) Templates mitziehen
	await db.collection('productTemplates').updateMany(
		{ defaultStorageLocation: oldName },
		{ $set: { defaultStorageLocation: name, updatedAt: new Date() } }
	);

	throw redirect(303, '/lagerorte');
},


	delete: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();
		const id = String(fd.get('id') || '');

		if (!id) return fail(400, { message: 'ID fehlt.' });

		let _id;
		try {
			_id = new ObjectId(id);
		} catch {
			return fail(400, { message: 'Ungültige ID.' });
		}

		await db.collection('storageLocations').deleteOne({ _id });
		throw redirect(303, '/lagerorte');
	}
};
