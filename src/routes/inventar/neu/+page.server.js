import { getDb } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';

// ---------- helpers ----------
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

function safeNumber(v, fallback = 0) {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

// ---------- load templates for suggestions ----------
export async function load() {
	const db = await getDb();

	const templates = await db.collection('productTemplates').find({}).sort({ name: 1 }).toArray();

	return {
		templates: templates.map((t) => ({
			id: t._id.toString(),
			name: t.name ?? '',
			normalizedName: t.normalizedName ?? (t.name ?? '').toLowerCase(),
			icon: t.icon ?? '🥕',

			displayUnit: t.displayUnit ?? 'Stück',
			amountPerUnitDisplay: safeNumber(t.amountPerUnitDisplay, 1),

			defaultStorageLocation: t.defaultStorageLocation ?? 'Kühlschrank',
			defaultPricePerUnit: safeNumber(t.defaultPricePerUnit, 0)
		}))
	};
}

export const actions = {
	default: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();

		// ✅ Achtung: im neu/+page.svelte heißt das Feld name="unit"
		// Darum holen wir es hier als displayUnit aus "unit"
		const name = String(fd.get('name') || '').trim();
		const icon = String(fd.get('icon') || '🥕');

		const displayUnit = String(fd.get('unit') || 'Stück'); // ✅ FIX: displayUnit ist jetzt definiert
		let amountPerUnitDisplay = safeNumber(fd.get('amountPerUnit'), 0);

		const storageLocation = String(fd.get('storageLocation') || 'Kühlschrank');

		const rawPrice = safeNumber(fd.get('pricePerUnit'), 0);
		const pricePerUnit = roundToStep(rawPrice, 0.05);

		const quantities = fd.getAll('variant_quantity');
		const expirations = fd.getAll('variant_expirationDate');

		if (!name) return fail(400, { message: 'Name fehlt.' });
		if (!quantities.length || !expirations.length) {
			return fail(400, { message: 'Mindestens eine Variante wird benötigt.' });
		}

		// Einheit normalisieren (Pack-Logik)
		const { packUnit, factorToBase } = normalizePackUnit(displayUnit);

		// ✅ Regel: Stück => Menge pro Einheit ist immer 1
		if (!packUnit) amountPerUnitDisplay = 1;
		if (packUnit && (!amountPerUnitDisplay || amountPerUnitDisplay <= 0)) {
			return fail(400, { message: 'Menge pro Einheit muss > 0 sein.' });
		}

		const packSize = packUnit ? amountPerUnitDisplay * factorToBase : null;

		// Varianten bauen (neues Modell)
		const variants = quantities.map((q, i) => {
			const pieces = safeNumber(q, 0);
			const exp = String(expirations[i] || '');

			if (packUnit) {
				return {
					remainingAmount: pieces * (packSize || 0),
					expirationDate: exp,
					status: 'ok'
				};
			}

			return {
				piecesRemaining: pieces,
				expirationDate: exp,
				status: 'ok'
			};
		});

		const totalQuantity = packUnit
			? variants.reduce((sum, v) => {
					const amt = safeNumber(v.remainingAmount, 0);
					if (!packSize || amt <= 0) return sum;
					return sum + Math.ceil(amt / packSize);
			  }, 0)
			: variants.reduce((sum, v) => sum + safeNumber(v.piecesRemaining, 0), 0);

		const normalizedName = name.toLowerCase();

		// Produkt speichern
		const insertRes = await db.collection('products').insertOne({
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

			createdAt: new Date(),
			updatedAt: new Date()
		});

		// ✅ purchased event loggen (damit Statistik "Ausgegeben" stimmt)
		if (totalQuantity > 0 && pricePerUnit > 0) {
			await db.collection('productEvents').insertOne({
				productId: insertRes.insertedId.toString(),
				normalizedName,
				name,
				type: 'purchased',
				unit: 'Stück', // Packs/Stück zählen wir in Statistik als "Stück"
				quantity: totalQuantity,
				value: totalQuantity * pricePerUnit,
				createdAt: new Date()
			});
		}

		// ✅ Template updaten/erstellen (damit Vorschläge bleiben)
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
