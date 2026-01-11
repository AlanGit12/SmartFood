import { getDb } from '$lib/server/db.js';

/**
 * Statistik basiert auf productEvents:
 * type: 'purchased' | 'consumed' | 'disposed'
 * value: CHF Wert (number)
 *
 * Wir berechnen:
 * - totals: purchased/consumed/disposed (CHF)
 * - daily Verlauf für die letzten N Tage (consumed/disposed/purchased)
 */

function startOfDayUTC(date) {
	return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUTC(date, days) {
	const d = new Date(date);
	d.setUTCDate(d.getUTCDate() + days);
	return d;
}

function isoDayUTC(date) {
	// YYYY-MM-DD
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, '0');
	const d = String(date.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export async function load() {
	const db = await getDb();

	const DAYS = 14; // Verlauf: letzte 14 Tage
	const today = startOfDayUTC(new Date());
	const from = addDaysUTC(today, -(DAYS - 1));
	const toExclusive = addDaysUTC(today, 1); // bis morgen 00:00 UTC

	// --- Totals (alles)
	const totalsAgg = await db
		.collection('productEvents')
		.aggregate([
			{
				$group: {
					_id: '$type',
					totalValue: { $sum: { $ifNull: ['$value', 0] } },
					count: { $sum: 1 }
				}
			}
		])
		.toArray();

	const totals = {
		purchasedValue: 0,
		consumedValue: 0,
		disposedValue: 0,
		eventsCount: 0
	};

	for (const row of totalsAgg) {
		if (row._id === 'purchased') totals.purchasedValue = row.totalValue || 0;
		if (row._id === 'consumed') totals.consumedValue = row.totalValue || 0;
		if (row._id === 'disposed') totals.disposedValue = row.totalValue || 0;
		totals.eventsCount += row.count || 0;
	}

	// --- Daily Verlauf (letzte N Tage)
	// Wir laden Events im Zeitraum und gruppieren pro Tag + Typ
	const dailyAgg = await db
		.collection('productEvents')
		.aggregate([
			{
				$match: {
					createdAt: { $gte: from, $lt: toExclusive },
					type: { $in: ['purchased', 'consumed', 'disposed'] }
				}
			},
			{
				$addFields: {
					day: {
						$dateToString: {
							format: '%Y-%m-%d',
							date: '$createdAt',
							timezone: 'UTC'
						}
					}
				}
			},
			{
				$group: {
					_id: { day: '$day', type: '$type' },
					value: { $sum: { $ifNull: ['$value', 0] } }
				}
			}
		])
		.toArray();

	// Map: day -> { purchasedValue, consumedValue, disposedValue }
	const byDay = new Map();
	for (const row of dailyAgg) {
		const day = row._id.day;
		const type = row._id.type;
		const value = row.value || 0;

		if (!byDay.has(day)) {
			byDay.set(day, { day, purchasedValue: 0, consumedValue: 0, disposedValue: 0 });
		}
		const obj = byDay.get(day);
		if (type === 'purchased') obj.purchasedValue += value;
		if (type === 'consumed') obj.consumedValue += value;
		if (type === 'disposed') obj.disposedValue += value;
	}

	// Wir füllen fehlende Tage auf (damit Chart immer gleich lang ist)
	const daily = [];
	for (let i = 0; i < DAYS; i++) {
		const d = addDaysUTC(from, i);
		const key = isoDayUTC(d);
		daily.push(byDay.get(key) ?? { day: key, purchasedValue: 0, consumedValue: 0, disposedValue: 0 });
	}

	// KPIs für Overview (für UI)
	const overview = {
		spentCHF: totals.purchasedValue,      // "ausgegeben"
		consumedCHF: totals.consumedValue,    // "konsumiert"
		wastedCHF: totals.disposedValue,      // "entsorgt"
		wasteRate: totals.purchasedValue > 0 ? totals.disposedValue / totals.purchasedValue : 0
	};

	return { overview, daily };
}
