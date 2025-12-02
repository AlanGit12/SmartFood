// src/routes/inventar/[id]/bearbeiten/+page.server.js
import { getDb } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { error, redirect, fail } from '@sveltejs/kit';

function roundToStep(value, step) {
	return Math.round(value / step) * step;
}

export async function load({ params }) {
	const db = await getDb();

	let _id;
	try {
		_id = new ObjectId(params.id);
	} catch (err) {
		throw error(400, 'Ungültige Produkt-ID');
	}

	const doc = await db.collection('products').findOne({ _id });

	if (!doc) {
		throw error(404, 'Produkt nicht gefunden');
	}

	const variants = (doc.variants ?? []).map((v, index) => ({
		id: index + 1,
		quantity: v.quantity ?? 0,
		expirationDate: v.expirationDate ?? '',
		status: v.status ?? 'ok'
	}));

	return {
		product: {
			id: params.id,
			name: doc.name,
			icon: doc.icon ?? '🥕',
			unit: doc.unit ?? 'Stück',
			storageLocation: doc.storageLocation ?? 'Kühlschrank',
			pricePerUnit: doc.pricePerUnit ?? 0,
			amountPerUnit: doc.amountPerUnit ?? 0,
			variants
		}
	};
}

export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		const name = formData.get('name');
		const icon = formData.get('icon') || '🥕';
		const unit = formData.get('unit');
		const storageLocation = formData.get('storageLocation');
		const rawPrice = parseFloat(formData.get('pricePerUnit') || '0');
		const pricePerUnit = roundToStep(rawPrice, 0.05);
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
			status: 'ok'
		}));

		const totalQuantity = variants.reduce(
			(sum, v) => sum + (v.quantity || 0),
			0
		);

		const normalizedName = name.trim().toLowerCase();

		const db = await getDb();

		let _id;
		try {
			_id = new ObjectId(params.id);
		} catch (err) {
			return fail(400, { message: 'Ungültige Produkt-ID' });
		}

		// Produkt im Inventar aktualisieren
		await db.collection('products').updateOne(
			{ _id },
			{
				$set: {
					normalizedName,
					name,
					icon,
					unit,
					storageLocation,
					pricePerUnit,
					amountPerUnit,
					variants,
					totalQuantity,
					updatedAt: new Date()
				}
			}
		);

		// Produkt-Vorlage mitziehen
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

		throw redirect(303, '/inventar');
	}
};
