import { getDb } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

function requireAdmin(fd) {
	const token = String(fd.get('token') || '');
	const expected = env.ADMIN_TOKEN;

	if (!expected) return { ok: false, message: 'ADMIN_TOKEN fehlt in .env' };
	if (!token || token !== expected) return { ok: false, message: 'Ungültiger Admin-Token.' };

	return { ok: true };
}

export async function load() {
	// nur Info anzeigen (ohne Token)
	return { ok: true };
}

export const actions = {
	clearProducts: async ({ request }) => {
		const fd = await request.formData();
		const auth = requireAdmin(fd);
		if (!auth.ok) return fail(401, { message: auth.message });

		const db = await getDb();
		await db.collection('products').deleteMany({});
		throw redirect(303, '/inventar');
	},

	clearEvents: async ({ request }) => {
		const fd = await request.formData();
		const auth = requireAdmin(fd);
		if (!auth.ok) return fail(401, { message: auth.message });

		const db = await getDb();
		await db.collection('productEvents').deleteMany({});
		throw redirect(303, '/statistiken');
	},

	clearTemplates: async ({ request }) => {
		const fd = await request.formData();
		const auth = requireAdmin(fd);
		if (!auth.ok) return fail(401, { message: auth.message });

		const db = await getDb();
		await db.collection('productTemplates').deleteMany({});
		throw redirect(303, '/vorlagen');
	},

	resetLocations: async ({ request }) => {
		const fd = await request.formData();
		const auth = requireAdmin(fd);
		if (!auth.ok) return fail(401, { message: auth.message });

		const db = await getDb();
		const col = db.collection('storageLocations');

		// alles löschen
		await col.deleteMany({});

		// Standard neu anlegen
		await col.insertMany([
			{ name: 'Kühlschrank', order: 1, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Vorratsschrank', order: 2, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Tiefkühler', order: 3, createdAt: new Date(), updatedAt: new Date() }
		]);

		throw redirect(303, '/lagerorte');
	},

	resetAll: async ({ request }) => {
		const fd = await request.formData();
		const auth = requireAdmin(fd);
		if (!auth.ok) return fail(401, { message: auth.message });

		const db = await getDb();

		await db.collection('products').deleteMany({});
		await db.collection('productEvents').deleteMany({});
		await db.collection('productTemplates').deleteMany({});

		const col = db.collection('storageLocations');
		await col.deleteMany({});
		await col.insertMany([
			{ name: 'Kühlschrank', order: 1, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Vorratsschrank', order: 2, createdAt: new Date(), updatedAt: new Date() },
			{ name: 'Tiefkühler', order: 3, createdAt: new Date(), updatedAt: new Date() }
		]);

		throw redirect(303, '/inventar');
	}
};
