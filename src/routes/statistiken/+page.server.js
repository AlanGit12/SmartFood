import { getDb } from '$lib/server/db.js';

// =====================================================
// Statistik Load
// - liest Events aus productEvents (wie Inventar sie schreibt)
// - nutzt createdAt statt date
// =====================================================
export async function load() {
	const db = await getDb();

	// 1) Inventar
	const products = await db.collection('products').find().toArray();

	// 2) Entsorgt / Verbraucht Events
	const wasteEntries = await db.collection('productEvents')
		.find({ type: 'disposed' })
		.sort({ createdAt: 1 })
		.toArray();

	const consumedEntries = await db.collection('productEvents')
		.find({ type: 'consumed' })
		.sort({ createdAt: 1 })
		.toArray();

	// 3) Monatsbudget (nur falls ihr später 'added' Events schreibt)
	const monthlySpend = await db.collection('productEvents')
		.aggregate([
			{ $match: { type: 'added' } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
					total: { $sum: '$value' }
				}
			},
			{ $sort: { _id: 1 } }
		])
		.toArray();

	// 4) Aufbewahrungsort
	const categoryStats = products.reduce((acc, p) => {
		const key = p.storageLocation || 'Unbekannt';
		acc[key] = (acc[key] || 0) + (p.totalQuantity || 0);
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
