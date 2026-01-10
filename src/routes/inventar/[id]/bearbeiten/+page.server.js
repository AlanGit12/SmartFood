import { getDb } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { error, redirect, fail } from '@sveltejs/kit';

function roundToStep(value, step) {
	return Math.round(value / step) * step;
}

function normalizePackUnit(unit) {
	switch (unit) {
		case 'kg':
			return { packUnit: 'g', factorToBase: 1000 };
		case 'g':
			return { packUnit: 'g', factorToBase: 1 };
		case 'l':
			return { packUnit: 'ml', factorToBase: 1000 };
		case 'ml':
			return { packUnit: 'ml', factorToBase: 1 };
		case 'Stück':
		default:
			return { packUnit: null, factorToBase: 1 };
	}
}

export async function load({ params }) {
	const db = await getDb();

	let _id;
	try {
		_id = new ObjectId(params.id);
	} catch {
		throw error(400, 'Ungültige Produkt-ID');
	}

	const doc = await db.collection('products').findOne({ _id });
	if (!doc) throw error(404, 'Produkt nicht gefunden');

	// Wir zeigen in der UI weiterhin "Stückzahlen" pro Variante an.
	// Für Pack-Produkte leiten wir Stückzahl aus remainingAmount ab (ceil).
	const packUnit = doc.packUnit ?? null;
	const packSize = doc.packSize ?? null;

	const variants = (doc.variants ?? []).map((v, index) => {
		if (packUnit && packSize) {
			const amt = Number(v.remainingAmount || 0);
			const pieces = amt <= 0 ? 0 : Math.ceil(amt / packSize);
			return {
				id: index + 1,
				quantity: pieces, // UI Feld: Stück/Packungen
				expirationDate: v.expirationDate ?? '',
				status: v.status ?? 'ok'
			};
		}

		return {
			id: index + 1,
			quantity: Number(v.piecesRemaining || 0),
			expirationDate: v.expirationDate ?? '',
			status: v.status ?? 'ok'
		};
	});

	return {
		product: {
			id: params.id,
			name: doc.name,
			icon: doc.icon ?? '🥕',

			// Anzeige: wie zuvor
			unit: doc.displayUnit ?? 'Stück',
			storageLocation: doc.storageLocation ?? 'Kühlschrank',
			pricePerUnit: doc.pricePerUnit ?? 0,

			// Stückgröße im UI
			amountPerUnit: doc.amountPerUnitDisplay ?? 0,

			variants
		}
	};
}

export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		const name = formData.get('name');
		const icon = formData.get('icon') || '🥕';

		const displayUnit = formData.get('unit') || 'Stück';
		const storageLocation = formData.get('storageLocation');

		const rawPrice = parseFloat(formData.get('pricePerUnit') || '0');
		const pricePerUnit = roundToStep(rawPrice, 0.05);

		const amountPerUnitDisplay = parseFloat(formData.get('amountPerUnit') || '0');

		if (!name || !displayUnit || !storageLocation) {
			return fail(400, { message: 'Pflichtfelder fehlen.' });
		}

		const { packUnit, factorToBase } = normalizePackUnit(displayUnit);
		const packSize = packUnit ? amountPerUnitDisplay * factorToBase : null;

		const quantities = formData.getAll('variant_quantity');
		const expirations = formData.getAll('variant_expirationDate');

		if (!quantities.length || !expirations.length) {
			return fail(400, { message: 'Mindestens eine Variante wird benötigt.' });
		}

		// Beim Speichern schreiben wir wieder ins neue Modell:
		// quantity aus UI ist Stück/Packungen
		const variants = quantities.map((q, i) => {
			const pieces = Number(q) || 0;

			if (packUnit) {
				return {
					remainingAmount: pieces * (packSize || 0),
					expirationDate: expirations[i],
					status: 'ok'
				};
			}

			return {
				piecesRemaining: pieces,
				expirationDate: expirations[i],
				status: 'ok'
			};
		});

		const totalQuantity = packUnit
			? variants.reduce((sum, v) => {
					const amt = Number(v.remainingAmount || 0);
					if (!packSize || amt <= 0) return sum;
					return sum + Math.ceil(amt / packSize);
			  }, 0)
			: variants.reduce((sum, v) => sum + (Number(v.piecesRemaining || 0)), 0);

		const normalizedName = name.trim().toLowerCase();
		const db = await getDb();

		let _id;
		try {
			_id = new ObjectId(params.id);
		} catch {
			return fail(400, { message: 'Ungültige Produkt-ID' });
		}

		await db.collection('products').updateOne(
			{ _id },
			{
				$set: {
					normalizedName,
					name,
					icon,
					storageLocation,

					pricePerUnit,

					packUnit,
					packSize,
					displayUnit,
					amountPerUnitDisplay,

					variants,
					totalQuantity,
					updatedAt: new Date()
				}
			}
		);

		// Template mitziehen
		await db.collection('productTemplates').updateOne(
			{ normalizedName },
			{
				$set: {
					name,
					normalizedName,
					icon,

					displayUnit,
					amountPerUnitDisplay,
					packUnit,
					packSize,

					defaultStorageLocation: storageLocation,
					defaultPricePerUnit: pricePerUnit,
					updatedAt: new Date()
				},
				$setOnInsert: { createdAt: new Date() }
			},
			{ upsert: true }
		);

		throw redirect(303, '/inventar');
	}
};
