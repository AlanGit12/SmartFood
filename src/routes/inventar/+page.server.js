// src/routes/inventar/+page.server.js
import { getDb } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { redirect, fail } from '@sveltejs/kit';

// Lädt alle Produkte fürs Inventar
export async function load() {
	const db = await getDb();

	const docs = await db
		.collection('products')
		.find({})
		.sort({ name: 1 })
		.toArray();

	const products = docs.map((doc) => {
		const variants = doc.variants ?? [];

		const totalQuantity =
			typeof doc.totalQuantity === 'number'
				? doc.totalQuantity
				: variants.reduce((sum, v) => sum + (v.quantity || 0), 0);

		return {
			id: doc._id.toString(),
			normalizedName: doc.normalizedName ?? doc.name?.toLowerCase() ?? '',
			name: doc.name,
			icon: doc.icon ?? '🥕',
			unit: doc.unit ?? 'Stück',
			storageLocation: doc.storageLocation ?? 'Kühlschrank',
			pricePerUnit: doc.pricePerUnit ?? 0,
			amountPerUnit: doc.amountPerUnit ?? null,
			variants,
			totalQuantity
		};
	});

	return { products };
}

// Actions für Formular-Buttons auf der Inventarseite
export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const intent = formData.get('intent');
		const productId = formData.get('productId');

		if (!productId) {
			return fail(400, { message: 'productId fehlt' });
		}

		if (!intent) {
			return redirect(303, '/inventar');
		}

		const db = await getDb();
		let _id;

		try {
			_id = new ObjectId(productId);
		} catch (err) {
			return fail(400, { message: 'Ungültige Produkt-ID' });
		}

		const product = await db.collection('products').findOne({ _id });

		if (!product) {
			return fail(404, { message: 'Produkt nicht gefunden' });
		}

		const variants = [...(product.variants ?? [])];
		function roundToStep(value, step) {
		return Math.round(value / step) * step;
		}

		const rawPrice = parseFloat(formData.get('pricePerUnit') || '0');
		const pricePerUnit = roundToStep(rawPrice, 0.05);

		// Helper, um totalQuantity neu zu berechnen
		const calcTotalQuantity = () =>
			variants.reduce((sum, v) => sum + (v.quantity || 0), 0);

		// 🔹 1. Variant-spezifische Intents: dec:X, inc:X, dispose:X
		if (
			intent.startsWith('dec:') ||
			intent.startsWith('inc:') ||
			intent.startsWith('dispose:')
		) {
			const [action, indexStr] = intent.split(':');
			const index = Number(indexStr);

			if (
				Number.isNaN(index) ||
				index < 0 ||
				index >= variants.length
			) {
				return fail(400, { message: 'Ungültiger Varianten-Index' });
			}

			const target = { ...variants[index] }; // Kopie
			let eventType = null;
			let eventQuantity = 0;

			if (action === 'dec') {
				if (target.quantity > 0) {
					target.quantity -= 1;
					eventType = 'consumed';
					eventQuantity = 1;
				}
				if (target.quantity <= 0) {
					variants.splice(index, 1);
				} else {
					variants[index] = target;
				}
			} else if (action === 'inc') {
				target.quantity = (target.quantity || 0) + 1;
				variants[index] = target;
				// aktuell kein Event – könnte später 'addedManual' o.ä. werden
			} else if (action === 'dispose') {
				eventType = 'disposed';
				eventQuantity = target.quantity || 0;
				variants.splice(index, 1);
			}

			const newTotalQuantity = calcTotalQuantity();
			const totalValueChange = eventQuantity * pricePerUnit;

			if (eventType && eventQuantity > 0) {
				await db.collection('productEvents').insertOne({
					productId,
					normalizedName: product.normalizedName,
					name: product.name,
					type: eventType, // 'consumed' | 'disposed'
					unit: product.unit,
					quantity: eventQuantity,
					value: totalValueChange,
					createdAt: new Date()
				});
			}

			if (newTotalQuantity <= 0) {
				// alle Varianten weg → Produkt ganz löschen
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

		// 🔹 2. Gesamte Produkt-Intents: delete / disposeAll
		const variantsForTotal = variants;
		const totalQuantity = variantsForTotal.reduce(
			(sum, v) => sum + (v.quantity || 0),
			0
		);
		const totalValue = pricePerUnit * totalQuantity;

		if (intent === 'delete' || intent === 'disposeAll') {
			const type = intent === 'delete' ? 'consumed' : 'disposed';

			await db.collection('productEvents').insertOne({
				productId,
				normalizedName: product.normalizedName,
				name: product.name,
				type, // 'consumed' | 'disposed'
				unit: product.unit,
				quantity: totalQuantity,
				value: totalValue,
				createdAt: new Date()
			});

			await db.collection('products').deleteOne({ _id });

			return redirect(303, '/inventar');
		}

		// andere Intents ignorieren wir vorerst
		return redirect(303, '/inventar');
	}
};