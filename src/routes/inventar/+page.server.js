import { getDb } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { redirect, fail } from '@sveltejs/kit';

/**
 * =========================================================
 * LOAD:
 * - liefert products inkl. packUnit/packSize
 * - totalQuantity ist Summe Packungen (ceil) oder Stück
 *
 * ACTIONS:
 * - inc/dec ändern immer 1 Packung/Stück
 * - custom (decCustom) nur für packUnit-Produkte (g/ml):
 *   remainingAmount -= custom
 * =========================================================
 */

function roundToStep(value, step) {
	return Math.round(value / step) * step;
}

function packsFromRemaining(remainingAmount, packSize) {
	const amt = Number(remainingAmount || 0);
	if (!packSize || amt <= 0) return 0;
	return Math.ceil(amt / packSize);
}

export async function load() {
	const db = await getDb();

	const docs = await db
		.collection('products')
		.find({})
		.sort({ name: 1 })
		.toArray();

	const products = docs.map((doc) => {
		const variants = doc.variants ?? [];
		const packUnit = doc.packUnit ?? null;
		const packSize = doc.packSize ?? null;

		const totalQuantity = packUnit && packSize
			? variants.reduce((sum, v) => sum + packsFromRemaining(v.remainingAmount, packSize), 0)
			: variants.reduce((sum, v) => sum + (Number(v.piecesRemaining || 0)), 0);

		return {
			id: doc._id.toString(),
			normalizedName: doc.normalizedName ?? doc.name?.toLowerCase() ?? '',
			name: doc.name,
			icon: doc.icon ?? '🥕',

			storageLocation: doc.storageLocation ?? 'Kühlschrank',
			pricePerUnit: doc.pricePerUnit ?? 0,

			// NEU: pack info
			packUnit,
			packSize,
			displayUnit: doc.displayUnit ?? 'Stück',
			amountPerUnitDisplay: doc.amountPerUnitDisplay ?? 0,

			variants,
			totalQuantity
		};
	});

	return { products };
}

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const intent = formData.get('intent');
		const productId = formData.get('productId');

		if (!productId) return fail(400, { message: 'productId fehlt' });
		if (!intent) return redirect(303, '/inventar');

		const db = await getDb();

		let _id;
		try {
			_id = new ObjectId(productId);
		} catch {
			return fail(400, { message: 'Ungültige Produkt-ID' });
		}

		const product = await db.collection('products').findOne({ _id });
		if (!product) return fail(404, { message: 'Produkt nicht gefunden' });

		const variants = [...(product.variants ?? [])];

		const packUnit = product.packUnit ?? null;
		const packSize = product.packSize ?? null;
		const isPackProduct = Boolean(packUnit && packSize);

		// Preis: "pro Stück/Packung"
		const rawPrice = parseFloat(formData.get('pricePerUnit') || product.pricePerUnit || '0');
		const pricePerUnit = roundToStep(rawPrice, 0.05);

		const calcTotalQuantity = () => {
			if (isPackProduct) {
				return variants.reduce((sum, v) => sum + packsFromRemaining(v.remainingAmount, packSize), 0);
			}
			return variants.reduce((sum, v) => sum + (Number(v.piecesRemaining || 0)), 0);
		};

		// =====================================================
		// 1) VARIANT-INTENTS: inc/dec/decCustom/dispose
		// =====================================================
		if (
			intent.startsWith('inc:') ||
			intent.startsWith('dec:') ||
			intent.startsWith('decCustom:') ||
			intent.startsWith('dispose:')
		) {
			const [action, indexStr] = intent.split(':');
			const index = Number(indexStr);

			if (Number.isNaN(index) || index < 0 || index >= variants.length) {
				return fail(400, { message: 'Ungültiger Varianten-Index' });
			}

			const target = { ...variants[index] };

			let eventType = null;
			let eventQuantity = 0;
			let eventUnit = 'Stück';

			if (action === 'inc') {
				// +1 Packung / +1 Stück
				if (isPackProduct) {
					target.remainingAmount = Number(target.remainingAmount || 0) + packSize;
				} else {
					target.piecesRemaining = Number(target.piecesRemaining || 0) + 1;
				}
				variants[index] = target;

			} else if (action === 'dec') {
				// -1 Packung / -1 Stück
				eventType = 'consumed';
				eventQuantity = 1;
				eventUnit = 'Stück';

				if (isPackProduct) {
					target.remainingAmount = Math.max(0, Number(target.remainingAmount || 0) - packSize);
					if (Number(target.remainingAmount || 0) <= 0) variants.splice(index, 1);
					else variants[index] = target;
				} else {
					target.piecesRemaining = Math.max(0, Number(target.piecesRemaining || 0) - 1);
					if (Number(target.piecesRemaining || 0) <= 0) variants.splice(index, 1);
					else variants[index] = target;
				}

			} else if (action === 'decCustom') {
				// nur bei Pack-Produkten sinnvoll (UI sendet es nur dann)
				if (!isPackProduct) return redirect(303, '/inventar');

				const raw = formData.get(`customAmount:${index}`);
				const customAmount = Number(raw);

				if (!customAmount || customAmount <= 0) {
					return fail(400, { message: 'Bitte eine gültige Menge eingeben.' });
				}

				eventType = 'consumed';
				eventQuantity = customAmount;
				eventUnit = packUnit;

				target.remainingAmount = Math.max(0, Number(target.remainingAmount || 0) - customAmount);

				if (Number(target.remainingAmount || 0) <= 0) variants.splice(index, 1);
				else variants[index] = target;

			} else if (action === 'dispose') {
				eventType = 'disposed';

				if (isPackProduct) {
					eventQuantity = Number(target.remainingAmount || 0);
					eventUnit = packUnit;
				} else {
					eventQuantity = Number(target.piecesRemaining || 0);
					eventUnit = 'Stück';
				}

				variants.splice(index, 1);
			}

			const newTotalQuantity = calcTotalQuantity();

			// Value: bei Stück-Events kann man Preis pro Stück rechnen.
			// Bei g/ml-Events (custom) lassen wir value 0, damit es nicht falsch wirkt.
			const value = eventUnit === 'Stück' ? eventQuantity * pricePerUnit : 0;

			if (eventType && eventQuantity > 0) {
				await db.collection('productEvents').insertOne({
					productId,
					normalizedName: product.normalizedName,
					name: product.name,
					type: eventType,
					unit: eventUnit,
					quantity: eventQuantity,
					value,
					createdAt: new Date()
				});
			}

			if (newTotalQuantity <= 0) {
				await db.collection('products').deleteOne({ _id });
			} else {
				await db.collection('products').updateOne(
					{ _id },
					{
						$set: {
							variants,
							totalQuantity: newTotalQuantity,
							updatedAt: new Date()
						}
					}
				);
			}

			return redirect(303, '/inventar');
		}

		// =====================================================
		// 2) PRODUKT-GESAMT: delete / disposeAll
		// delete = consumed, disposeAll = disposed
		// =====================================================
		const totalQuantity = calcTotalQuantity();

		if (intent === 'delete' || intent === 'disposeAll') {
			const type = intent === 'delete' ? 'consumed' : 'disposed';

			// wir loggen nur Stück (Packungen) als quantity
			if (totalQuantity > 0) {
				await db.collection('productEvents').insertOne({
					productId,
					normalizedName: product.normalizedName,
					name: product.name,
					type,
					unit: 'Stück',
					quantity: totalQuantity,
					value: totalQuantity * pricePerUnit,
					createdAt: new Date()
				});
			}

			await db.collection('products').deleteOne({ _id });
			return redirect(303, '/inventar');
		}

		return redirect(303, '/inventar');
	}
};
