// src/routes/inventar/neu/+page.server.js
import { getDb } from '$lib/server/db.js';
import { redirect, fail } from '@sveltejs/kit';

export async function load() {
	const db = await getDb();

	const docs = await db
		.collection('productTemplates')
		.find({})
		.sort({ name: 1 })
		.toArray();

	const templates = docs.map((doc) => ({
		id: doc._id.toString(),
		name: doc.name,
		icon: doc.icon ?? '🍽️',
		unit: doc.unit ?? 'Stück',
		amountPerUnit: doc.amountPerUnit ?? 0,
		storageLocation: doc.defaultStorageLocation ?? 'Kühlschrank',
		pricePerUnit: doc.defaultPricePerUnit ?? 0
	}));

	return { templates };
}

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

		const name = formData.get('name');
		const icon = formData.get('icon') || '🥕';
		const unit = formData.get('unit');
		const storageLocation = formData.get('storageLocation');
		const pricePerUnit = parseFloat(formData.get('pricePerUnit') || '0');
		const amountPerUnit = parseFloat(formData.get('amountPerUnit') || '0');

		if (!name || !unit || !storageLocation) {
			return fail(400, { message: 'Pflichtfelder fehlen.' });
		}

		const quantities = formData.getAll('variant_quantity');
		const expirations = formData.getAll('variant_expirationDate');

		if (!quantities.length || !expirations.length) {
			return fail(400, { message: 'Mindestens eine Variante wird benötigt.' });
		}

		const variants = quantities.map((q, i) => ({
			quantity: Number(q),
			expirationDate: expirations[i],
			status: 'ok' // optional: später basierend auf Datum berechnen
		}));

		const totalQuantity = variants.reduce(
			(sum, v) => sum + (v.quantity || 0),
			0
		);

		const normalizedName = name.trim().toLowerCase();

		const db = await getDb();

		// 🔹 1. Inventar aktualisieren (products) – Merging nach normalizedName
		const existing = await db
			.collection('products')
			.findOne({ normalizedName });

		if (existing) {
			const mergedVariants = [
				...(existing.variants ?? []),
				...variants
			];

			const mergedTotalQuantity = mergedVariants.reduce(
				(sum, v) => sum + (v.quantity || 0),
				0
			);

			await db.collection('products').updateOne(
				{ _id: existing._id },
				{
					$set: {
						normalizedName,
						name, // Schreibweise ggf. aktualisieren
						icon,
						unit,
						storageLocation,
						pricePerUnit,
						amountPerUnit,
						variants: mergedVariants,
						totalQuantity: mergedTotalQuantity,
						updatedAt: new Date()
					}
				}
			);
		} else {
			// komplett neues Produkt im Inventar
			await db.collection('products').insertOne({
				normalizedName,
				name,
				icon,
				unit,
				storageLocation,
				pricePerUnit,
				amountPerUnit,
				variants,
				totalQuantity,
				createdAt: new Date()
			});
		}

		// 🔹 2. Produkt-Vorlage aktualisieren / anlegen (productTemplates)
		const templateData = {
			name,
			normalizedName,
			icon,
			unit,
			amountPerUnit,
			defaultStorageLocation: storageLocation,
			defaultPricePerUnit: pricePerUnit,
			updatedAt: new Date()
		};

		await db.collection('productTemplates').updateOne(
			{ normalizedName },
			{
				$set: templateData,
				$setOnInsert: { createdAt: new Date() }
			},
			{ upsert: true }
		);

		// zurück zur Inventarübersicht
		throw redirect(303, '/inventar');
	}
};
