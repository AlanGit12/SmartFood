import { getDb } from '$lib/server/db.js';
import { redirect, fail } from '@sveltejs/kit';

/**
 * =========================================================
 * Zielmodell:
 * - Produkte ohne Stückgröße: packUnit = null, packSize = null
 *   Varianten speichern: piecesRemaining (Stück)
 *
 * - Produkte mit Stückgröße: packUnit = 'g'|'ml', packSize (Basis, z.B. 1000)
 *   Varianten speichern: remainingAmount (Basis, z.B. g/ml)
 *   Packungen im UI = ceil(remainingAmount / packSize)
 * =========================================================
 */

function roundToStep(value, step) {
	return Math.round(value / step) * step;
}

function normalizePackUnit(unit) {
	// User kann kg/l wählen -> wir speichern in Basis g/ml
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

		// Anzeige-Werte für Formular
		unit: doc.displayUnit ?? 'Stück',
		amountPerUnit: doc.amountPerUnitDisplay ?? 0,

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

		// Das ist bei euch im UI weiterhin "unit" Dropdown
		// Bedeutung:
		// - 'Stück' => keine Stückgröße (Apfel)
		// - 'g/kg/ml/l' => Stückgröße existiert (Packung mit Inhalt)
		const displayUnit = formData.get('unit') || 'Stück';
		const storageLocation = formData.get('storageLocation');

		const rawPrice = parseFloat(formData.get('pricePerUnit') || '0');
		const pricePerUnit = roundToStep(rawPrice, 0.05);

		// "Menge pro Einheit" (z.B. 250 ml oder 1 kg)
		const amountPerUnitDisplay = parseFloat(formData.get('amountPerUnit') || '0');

		if (!name || !displayUnit || !storageLocation) {
			return fail(400, { message: 'Pflichtfelder fehlen.' });
		}

		const { packUnit, factorToBase } = normalizePackUnit(displayUnit);

		// packSize in Basis (g/ml), nur wenn packUnit existiert
		const packSize =
			packUnit ? amountPerUnitDisplay * factorToBase : null;

		// Varianten aus Formular: variant_quantity ist immer "Stück/Packungen"
		const quantities = formData.getAll('variant_quantity');
		const expirations = formData.getAll('variant_expirationDate');

		if (!quantities.length || !expirations.length) {
			return fail(400, { message: 'Mindestens eine Variante wird benötigt.' });
		}

		const variants = quantities.map((q, i) => {
			const pieces = Number(q) || 0;

			if (packUnit) {
				// Packung mit Inhalt: speichere remainingAmount
				return {
					remainingAmount: pieces * (packSize || 0),
					expirationDate: expirations[i],
					status: 'ok'
				};
			}

			// Reines Stück-Produkt
			return {
				piecesRemaining: pieces,
				expirationDate: expirations[i],
				status: 'ok'
			};
		});

		// totalQuantity = Summe der Packungen (ceil) oder Stück
		const totalQuantity = packUnit
			? variants.reduce((sum, v) => {
					const amt = Number(v.remainingAmount || 0);
					if (!packSize || amt <= 0) return sum;
					return sum + Math.ceil(amt / packSize);
			  }, 0)
			: variants.reduce((sum, v) => sum + (Number(v.piecesRemaining || 0)), 0);

		const normalizedName = name.trim().toLowerCase();
		const db = await getDb();

		// Merge nach normalizedName wie bei euch
		const existing = await db.collection('products').findOne({ normalizedName });

		const productDocBase = {
			normalizedName,
			name,
			icon,
			storageLocation,

			// Preis pro Stück/Packung
			pricePerUnit,

			// NEU: Pack-Infos
			packUnit,              // 'g'|'ml'|null
			packSize,              // number in base or null
			displayUnit,           // 'kg'/'g'/'ml'/'l'/'Stück'
			amountPerUnitDisplay,  // z.B. 1 (kg) oder 250 (ml) oder 0

			updatedAt: new Date()
		};

		if (existing) {
			const mergedVariants = [...(existing.variants ?? []), ...variants];

			const mergedTotalQuantity = packUnit
				? mergedVariants.reduce((sum, v) => {
						const amt = Number(v.remainingAmount || 0);
						if (!packSize || amt <= 0) return sum;
						return sum + Math.ceil(amt / packSize);
				  }, 0)
				: mergedVariants.reduce((sum, v) => sum + (Number(v.piecesRemaining || 0)), 0);

			await db.collection('products').updateOne(
				{ _id: existing._id },
				{
					$set: {
						...productDocBase,
						variants: mergedVariants,
						totalQuantity: mergedTotalQuantity
					}
				}
			);
		} else {
			await db.collection('products').insertOne({
				...productDocBase,
				variants,
				totalQuantity,
				createdAt: new Date()
			});
		}

		// Template speichern (damit neu befüllen passt)
		await db.collection('productTemplates').updateOne(
			{ normalizedName },
			{
				$set: {
					name,
					normalizedName,
					icon,

					displayUnit,
					amountPerUnitDisplay,

					// auch pack info speichern (für spätere Logik)
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
