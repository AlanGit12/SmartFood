// src/routes/statistiken/+page.server.js
import { getDb } from '$lib/server/db.js';

export async function load() {
	const db = await getDb();

	// 🔹 1. Alle Produkte laden
	const products = await db.collection('products').find().toArray();

	// 🔹 2. FOOD WASTE – wie viel wurde entsorgt?
	const wasteEntries = await db.collection('productHistory')
		.find({ type: 'disposed' })
		.sort({ date: 1 })
		.toArray();

	// 🔹 3. Verbrauch – wie viel gegessen wurde?
	const consumedEntries = await db.collection('productHistory')
		.find({ type: 'consumed' })
		.sort({ date: 1 })
		.toArray();

	// 🔹 4. Monatsbudget
	const monthlySpend = await db.collection('productHistory')
		.aggregate([
			{ $match: { type: 'added' } },
			{
				$group: {
					_id: { $substr: ['$date', 0, 7] }, // "2025-01"
					total: { $sum: '$totalPrice' }
				}
			},
			{ $sort: { _id: 1 } }
		])
		.toArray();

	// 🔹 5. Kategorien (Ort)
	const categoryStats = products.reduce((acc, p) => {
		const key = p.storageLocation || 'Unbekannt';
		acc[key] = (acc[key] || 0) + p.totalQuantity;
		return acc;
	}, {});

	return {
		inventory: products,
		waste: wasteEntries,
		consumed: consumedEntries,
		monthlySpend,
		categoryStats
	};
}
