// src/routes/inventar/neu/+page.server.js
import { getDb } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { getStorageLocations } from '$lib/server/storageLocations.js';

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

// ----------------------------
// LOAD: Templates + Lagerorte
// ----------------------------
export async function load() {
	const db = await getDb();

	const templates = await db.collection('productTemplates').find({}).sort({ name: 1 }).toArray();

	// ✅ passt zu deiner storageLocations.js (holt intern getDb())
	const locations = await getStorageLocations();

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
		})),
		locations
	};
}

export const actions = {
	default: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();

		// ✅ Toggle: Checkbox sendet nur was, wenn angehakt
		const createTemplate = fd.get('createTemplate') === '1';

		const name = String(fd.get('name') || '').trim();
		if (!name) return fail(400, { message: 'Name fehlt.' });

		const normalizedName = name.toLowerCase();

		const icon = String(fd.get('icon') || '🥕').trim() || '🥕';

		const displayUnit = String(fd.get('unit') || 'Stück');
		let amountPerUnitDisplay = safeNumber(fd.get('amountPerUnit'), 0);

		const storageLocation = String(fd.get('storageLocation') || 'Kühlschrank');

		const rawPrice = safeNumber(fd.get('pricePerUnit'), 0);
		const pricePerUnit = roundToStep(rawPrice, 0.05);

		// Einheit normalisieren
		const { packUnit, factorToBase } = normalizePackUnit(displayUnit);

		// ✅ Regel: Stück => amountPerUnitDisplay immer 1
		if (!packUnit) amountPerUnitDisplay = 1;

		if (packUnit && (!amountPerUnitDisplay || amountPerUnitDisplay <= 0)) {
			return fail(400, { message: 'Menge pro Einheit muss > 0 sein.' });
		}

		const packSize = packUnit ? amountPerUnitDisplay * factorToBase : null;
		const isPack = Boolean(packUnit && packSize);

		// Varianten aus Formular
		const quantities = fd.getAll('variant_quantity');
		const expirations = fd.getAll('variant_expirationDate');

		if (!quantities.length || !expirations.length) {
			return fail(400, { message: 'Mindestens eine Variante wird benötigt.' });
		}

		const incomingVariants = quantities.map((q, i) => {
			const pieces = safeNumber(q, 0);
			const exp = String(expirations[i] || '');

			if (isPack) {
				return {
					remainingAmount: pieces * (Number(packSize) || 0),
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

		// Wie viele Stück/Packungen wurden neu hinzugefügt?
		const addedPieces = incomingVariants.reduce((sum, v) => {
			if (isPack) {
				const amt = safeNumber(v.remainingAmount, 0);
				const ps = Number(packSize) || 0;
				if (ps <= 0 || amt <= 0) return sum;
				return sum + Math.ceil(amt / ps);
			}
			return sum + safeNumber(v.piecesRemaining, 0);
		}, 0);

		const productsCol = db.collection('products');
		const eventsCol = db.collection('productEvents');

		// Merge-Regel:
		// gleiche Card nur wenn:
		// normalizedName + storageLocation + pricePerUnit + packUnit + packSize gleich
		const mergeQuery = {
			normalizedName,
			storageLocation,
			pricePerUnit,
			packUnit,
			packSize
		};

		const existing = await productsCol.findOne(mergeQuery);

		// Merge helper (nach expirationDate)
		function mergeVariants(existingVariants, incoming, isPackProduct) {
			const merged = [...(existingVariants ?? [])];

			for (const v of incoming) {
				const exp = String(v.expirationDate || '');
				const idx = merged.findIndex((x) => String(x.expirationDate || '') === exp);

				if (idx === -1) {
					merged.push(v);
					continue;
				}

				const t = { ...merged[idx] };

				if (isPackProduct) {
					t.remainingAmount = safeNumber(t.remainingAmount, 0) + safeNumber(v.remainingAmount, 0);
				} else {
					t.piecesRemaining = safeNumber(t.piecesRemaining, 0) + safeNumber(v.piecesRemaining, 0);
				}

				merged[idx] = t;
			}

			// leere Varianten raus
			return merged.filter((x) => {
				if (isPackProduct) return safeNumber(x.remainingAmount, 0) > 0;
				return safeNumber(x.piecesRemaining, 0) > 0;
			});
		}

		function calcTotalQuantity(variants) {
			if (isPack) {
				const ps = Number(packSize) || 0;
				if (ps <= 0) return 0;

				return variants.reduce((sum, v) => {
					const amt = safeNumber(v.remainingAmount, 0);
					if (amt <= 0) return sum;
					return sum + Math.ceil(amt / ps);
				}, 0);
			}

			return variants.reduce((sum, v) => sum + safeNumber(v.piecesRemaining, 0), 0);
		}

		// ----------------------------
		// A) EXISTING => MERGE
		// ----------------------------
		if (existing) {
			const mergedVariants = mergeVariants(existing.variants ?? [], incomingVariants, isPack);
			const totalQuantity = calcTotalQuantity(mergedVariants);

			await productsCol.updateOne(
				{ _id: existing._id },
				{
					$set: {
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

			// purchased event (nur NEU hinzugefügt)
			if (addedPieces > 0) {
				await eventsCol.insertOne({
					productId: existing._id.toString(),
					normalizedName,
					name,
					type: 'purchased',
					unit: 'Stück',
					quantity: addedPieces,
					value: addedPieces * pricePerUnit,
					piecesEquivalent: addedPieces,
					createdAt: new Date()
				});
			}

			// ✅ Template nur wenn Toggle an
			if (createTemplate) {
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
			}

			throw redirect(303, '/inventar');
		}

		// ----------------------------
		// B) NEW => INSERT
		// ----------------------------
		const totalQuantity = calcTotalQuantity(incomingVariants);

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

		// purchased event
		if (addedPieces > 0) {
			await eventsCol.insertOne({
				productId: insertRes.insertedId.toString(),
				normalizedName,
				name,
				type: 'purchased',
				unit: 'Stück',
				quantity: addedPieces,
				value: addedPieces * pricePerUnit,
				piecesEquivalent: addedPieces,
				createdAt: new Date()
			});
		}

		// ✅ Template nur wenn Toggle an
		if (createTemplate) {
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
		}

		throw redirect(303, '/inventar');
	}
};
