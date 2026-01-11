import { getDb } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { redirect, fail } from '@sveltejs/kit';
import { mapProductDoc, calcTotalQuantity, roundToStep, logProductEvent } from '$lib/server/products.js';

function idQuery(id) {
	try {
		return { $or: [{ _id: new ObjectId(String(id)) }, { _id: String(id) }] };
	} catch {
		return { _id: String(id) };
	}
}

export async function load() {
	const db = await getDb();

	const docs = await db.collection('products').find({}).sort({ name: 1 }).toArray();
	const products = docs.map(mapProductDoc);

	return { products };
}

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const intent = String(formData.get('intent') || '');
		const productId = String(formData.get('productId') || '');

		if (!productId) return fail(400, { message: 'productId fehlt' });
		if (!intent) return redirect(303, '/inventar');

		const db = await getDb();

		const product = await db.collection('products').findOne(idQuery(productId));
		if (!product) return fail(404, { message: 'Produkt nicht gefunden' });

		const selector = { _id: product._id };
		const variants = [...(product.variants ?? [])];

		const packUnit = product.packUnit ?? null;
		const packSize = product.packSize ?? null;
		const isPack = Boolean(packUnit && packSize);

		const rawPrice = parseFloat(String(formData.get('pricePerUnit') || product.pricePerUnit || '0'));
		const pricePerUnit = roundToStep(Number.isFinite(rawPrice) ? rawPrice : 0, 0.05);

		// ---------- variant intents ----------
		if (intent.startsWith('inc:') || intent.startsWith('dec:') || intent.startsWith('decCustom:') || intent.startsWith('dispose:')) {
			const [action, indexStr] = intent.split(':');
			const index = Number(indexStr);

			if (!Number.isFinite(index) || index < 0 || index >= variants.length) {
				return fail(400, { message: 'Ungültiger Varianten-Index' });
			}

			const target = { ...variants[index] };

			let eventType = null;
			let eventQuantity = 0;
			let eventUnit = 'Stück';
			let eventValue = 0;

			if (action === 'inc') {
				// ✅ purchased
				eventType = 'purchased';
				eventQuantity = 1;
				eventUnit = 'Stück';
				eventValue = pricePerUnit;

				if (isPack) target.remainingAmount = Number(target.remainingAmount || 0) + Number(packSize);
				else target.piecesRemaining = Number(target.piecesRemaining || 0) + 1;

				variants[index] = target;
			}

			if (action === 'dec') {
				eventType = 'consumed';
				eventQuantity = 1;
				eventUnit = 'Stück';
				eventValue = pricePerUnit;

				if (isPack) {
					target.remainingAmount = Math.max(0, Number(target.remainingAmount || 0) - Number(packSize));
					if (Number(target.remainingAmount || 0) <= 0) variants.splice(index, 1);
					else variants[index] = target;
				} else {
					target.piecesRemaining = Math.max(0, Number(target.piecesRemaining || 0) - 1);
					if (Number(target.piecesRemaining || 0) <= 0) variants.splice(index, 1);
					else variants[index] = target;
				}
			}

			if (action === 'decCustom') {
				if (!isPack) return redirect(303, '/inventar');

				const raw = formData.get(`customAmount:${index}`);
				const customAmount = Number(raw);

				if (!customAmount || customAmount <= 0) {
					return fail(400, { message: 'Bitte eine gültige Menge eingeben.' });
				}

				eventType = 'consumed';
				eventQuantity = customAmount;
				eventUnit = packUnit;

				// ✅ OPTIONAL aber sehr sinnvoll:
				// anteiliger Wert: (verbrauch / packSize) * Preis pro Packung
				eventValue = (customAmount / Number(packSize)) * pricePerUnit;

				target.remainingAmount = Math.max(0, Number(target.remainingAmount || 0) - customAmount);
				if (Number(target.remainingAmount || 0) <= 0) variants.splice(index, 1);
				else variants[index] = target;
			}

			if (action === 'dispose') {
				eventType = 'disposed';

				if (isPack) {
					const remaining = Number(target.remainingAmount || 0);
					eventQuantity = remaining;
					eventUnit = packUnit;
					eventValue = (remaining / Number(packSize)) * pricePerUnit;
				} else {
					const pieces = Number(target.piecesRemaining || 0);
					eventQuantity = pieces;
					eventUnit = 'Stück';
					eventValue = pieces * pricePerUnit;
				}

				variants.splice(index, 1);
			}

			const newTotalQuantity = calcTotalQuantity({ variants, packUnit, packSize });

			// log event
			await logProductEvent(db, {
				product,
				type: eventType,
				unit: eventUnit,
				quantity: eventQuantity,
				value: eventValue
			});

			if (newTotalQuantity <= 0) {
				await db.collection('products').deleteOne(selector);
			} else {
				await db.collection('products').updateOne(selector, {
					$set: { variants, totalQuantity: newTotalQuantity, pricePerUnit, updatedAt: new Date() }
				});
			}

			return redirect(303, '/inventar');
		}

		// ---------- product intents ----------
		const totalQuantity = calcTotalQuantity({ variants, packUnit, packSize });

		if (intent === 'delete' || intent === 'disposeAll') {
			const type = intent === 'delete' ? 'consumed' : 'disposed';

			await logProductEvent(db, {
				product,
				type,
				unit: 'Stück',
				quantity: totalQuantity,
				value: totalQuantity * pricePerUnit
			});

			await db.collection('products').deleteOne(selector);
			return redirect(303, '/inventar');
		}

		return redirect(303, '/inventar');
	}
};
