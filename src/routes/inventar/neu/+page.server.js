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

		const name = String(fd.get('name') || '').trim();
		const icon = String(fd.get('icon') || '🥕');

		const displayUnit = String(fd.get('unit') || 'Stück');
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

		const normalizedName = name.toLowerCase();

		// Einheit normalisieren
		const { packUnit, factorToBase } = normalizePackUnit(displayUnit);

		// Stück => 1
		if (!packUnit) amountPerUnitDisplay = 1;
		if (packUnit && (!amountPerUnitDisplay || amountPerUnitDisplay <= 0)) {
			return fail(400, { message: 'Menge pro Einheit muss > 0 sein.' });
		}

		const packSize = packUnit ? amountPerUnitDisplay * factorToBase : null;

		// Neue Varianten aus dem Formular (können mehrere Zeilen sein)
		const incomingVariants = quantities.map((q, i) => {
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

		// -------------------------------------------------------
		// ✅ MERGE statt immer insert:
		// -------------------------------------------------------
		const productsCol = db.collection('products');
		const eventsCol = db.collection('productEvents');
		const mergeKey = `${normalizedName}__${storageLocation}__${pricePerUnit.toFixed(2)}__${packUnit || 'piece'}__${packSize || 0}`;


	const mergeQuery = {
	normalizedName,
	storageLocation,
	pricePerUnit,
	packUnit,
	packSize
};

const existing = await productsCol.findOne(mergeQuery);


		// helper: merge variants by expirationDate
		function mergeVariants(existingVariants, incoming, isPack) {
			const merged = [...(existingVariants ?? [])];

			for (const v of incoming) {
				const exp = String(v.expirationDate || '');
				const idx = merged.findIndex((x) => String(x.expirationDate || '') === exp);

				if (idx === -1) {
					merged.push(v);
					continue;
				}

				const target = { ...merged[idx] };

				if (isPack) {
					target.remainingAmount = safeNumber(target.remainingAmount, 0) + safeNumber(v.remainingAmount, 0);
				} else {
					target.piecesRemaining = safeNumber(target.piecesRemaining, 0) + safeNumber(v.piecesRemaining, 0);
				}

				merged[idx] = target;
			}

			// optional: leere raus
			return merged.filter((x) => {
				if (isPack) return safeNumber(x.remainingAmount, 0) > 0;
				return safeNumber(x.piecesRemaining, 0) > 0;
			});
		}

		function calcTotalQuantityLocal(variants) {
			if (packUnit && packSize) {
				return variants.reduce((sum, v) => {
					const amt = safeNumber(v.remainingAmount, 0);
					if (!packSize || amt <= 0) return sum;
					return sum + Math.ceil(amt / packSize);
				}, 0);
			}
			return variants.reduce((sum, v) => sum + safeNumber(v.piecesRemaining, 0), 0);
		}

		// Wie viele "Stück/Packungen" wurden durch diese Aktion hinzugefügt?
		// Für Pack-Produkte zählen wir Zeilenmenge als "pieces" (quantity input)
		const addedPieces = incomingVariants.reduce((sum, v) => {
			if (packUnit && packSize) {
				const amt = safeNumber(v.remainingAmount, 0);
				if (!packSize || amt <= 0) return sum;
				return sum + Math.ceil(amt / packSize);
			}
			return sum + safeNumber(v.piecesRemaining, 0);
		}, 0);

		if (existing) {
			// ✅ Merge mit vorhandenem Produkt
			const existingPackUnit = existing.packUnit ?? null;
			const existingPackSize = existing.packSize ?? null;

			// Achtung: Falls jemand ein Produkt vorher als Stück angelegt hat und jetzt als ml speichert,
			// ist das ein Datenbruch. Für MVP: wir überschreiben auf neuen Modus.
			const isPack = Boolean(packUnit && packSize);

			const mergedVariants = mergeVariants(existing.variants ?? [], incomingVariants, isPack);
			const totalQuantity = calcTotalQuantityLocal(mergedVariants);

			await productsCol.updateOne(
				{ _id: existing._id },
				{
					$set: {
						// Wir übernehmen Basisdaten vom neuen Eintrag (ihr könnt hier auch "nur wenn leer" machen)
						name,
						icon,
						storageLocation,
						pricePerUnit,

						packUnit,
						packSize,
						displayUnit,
						amountPerUnitDisplay,

						variants: mergedVariants,
						totalQuantity,
						updatedAt: new Date()
					}
				}
			);

			// purchased event loggen (nur addedPieces)
			if (addedPieces > 0 && pricePerUnit > 0) {
				await eventsCol.insertOne({
					productId: existing._id.toString(),
					normalizedName,
					name: existing.name ?? name,
					type: 'purchased',
					unit: 'Stück',
					quantity: addedPieces,
					value: addedPieces * pricePerUnit,
					createdAt: new Date()
				});
			}

			// Template updaten
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

		// ✅ Kein existing => neues Produkt anlegen (wie vorher)
		const totalQuantity = calcTotalQuantityLocal(incomingVariants);

		const insertRes = await productsCol.insertOne({
			normalizedName,
			name,
			icon,
			storageLocation,
			pricePerUnit,

			packUnit,
			packSize,
			displayUnit,
			amountPerUnitDisplay,

			variants: incomingVariants,
			totalQuantity,

			createdAt: new Date(),
			updatedAt: new Date()
		});

		if (addedPieces > 0 && pricePerUnit > 0) {
			await eventsCol.insertOne({
				productId: insertRes.insertedId.toString(),
				normalizedName,
				name,
				type: 'purchased',
				unit: 'Stück',
				quantity: addedPieces,
				value: addedPieces * pricePerUnit,
				createdAt: new Date()
			});
		}

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

