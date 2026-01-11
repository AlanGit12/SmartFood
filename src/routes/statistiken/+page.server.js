import { getDb } from '$lib/server/db.js';

function startOfDayUTC(d) {
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDaysUTC(d, days) {
	const x = new Date(d);
	x.setUTCDate(x.getUTCDate() + days);
	return x;
}
function addMonthsUTC(d, months) {
	const x = new Date(d);
	x.setUTCMonth(x.getUTCMonth() + months);
	return x;
}
function iso(d) {
	return d.toISOString().slice(0, 10);
}
function clampRange(r) {
	return ['1m', '3m', '6m', '12m'].includes(r) ? r : '3m';
}
function rangeToMonths(r) {
	if (r === '1m') return 1;
	if (r === '3m') return 3;
	if (r === '6m') return 6;
	return 12;
}
function weekStartISO(date) {
	const d = startOfDayUTC(new Date(date));
	const day = d.getUTCDay(); // 0=So
	const diffToMon = (day + 6) % 7;
	d.setUTCDate(d.getUTCDate() - diffToMon);
	return iso(d);
}

export async function load({ url }) {
	const db = await getDb();

	const range = clampRange(url.searchParams.get('range') || '3m');
	const months = rangeToMonths(range);

	const today = startOfDayUTC(new Date());
	const from = startOfDayUTC(addMonthsUTC(today, -months));
	const toExclusive = addDaysUTC(today, 1);

	// ✅ Filter wirkt: nur Events im Zeitraum
	const events = await db.collection('productEvents').find({
		createdAt: { $gte: from, $lt: toExclusive },
		type: { $in: ['purchased', 'disposed'] }
	}).toArray();

	// -----------------------
	// Wochen-Aggregation
	// -----------------------
	const map = new Map();

	for (const e of events) {
		const key = weekStartISO(e.createdAt);
		if (!map.has(key)) {
			map.set(key, { week: key, purchasedValue: 0, disposedValue: 0, disposedCount: 0 });
		}
		const w = map.get(key);

		if (e.type === 'purchased') {
			w.purchasedValue += Number(e.value || 0);
		}

		if (e.type === 'disposed') {
			w.disposedValue += Number(e.value || 0);

			// bevorzugt piecesEquivalent
			if (typeof e.piecesEquivalent === 'number') w.disposedCount += Number(e.piecesEquivalent || 0);
			else if (e.unit === 'Stück') w.disposedCount += Number(e.quantity || 0);
			else w.disposedCount += 1;
		}
	}

	// lückenlose Wochenliste NUR im Zeitraum
	const firstWeekISO = weekStartISO(from);
	let cursor = new Date(firstWeekISO + 'T00:00:00.000Z');

	const lastWeekISO = weekStartISO(today);
	const last = new Date(lastWeekISO + 'T00:00:00.000Z');

	const weeklyData = [];
	for (; cursor <= last; cursor = addDaysUTC(cursor, 7)) {
		const k = iso(cursor);
		weeklyData.push(map.get(k) ?? { week: k, purchasedValue: 0, disposedValue: 0, disposedCount: 0 });
	}

	const totals = weeklyData.reduce(
		(acc, w) => {
			acc.spent += w.purchasedValue;
			acc.wasteValue += w.disposedValue;
			acc.wasteCount += w.disposedCount;
			return acc;
		},
		{ spent: 0, wasteValue: 0, wasteCount: 0 }
	);

	// ✅ Waste-Quote
	const wasteQuote =
		totals.spent > 0 ? (totals.wasteValue / totals.spent) * 100 : 0;

	// -----------------------
	// Top 5 Wegwerf-Produkte (nach CHF)
	// -----------------------
	const disposedOnly = events.filter((e) => e.type === 'disposed');

	const byProduct = new Map();
	for (const e of disposedOnly) {
		const key = (e.normalizedName || e.name || '').toLowerCase();
		if (!key) continue;

		if (!byProduct.has(key)) {
			byProduct.set(key, {
				normalizedName: key,
				name: e.name || key,
				value: 0,
				count: 0
			});
		}
		const row = byProduct.get(key);
		row.value += Number(e.value || 0);

		if (typeof e.piecesEquivalent === 'number') row.count += Number(e.piecesEquivalent || 0);
		else if (e.unit === 'Stück') row.count += Number(e.quantity || 0);
		else row.count += 1;
	}

	const topWaste = Array.from(byProduct.values())
		.sort((a, b) => (b.value - a.value) || (b.count - a.count))
		.slice(0, 5);

	return {
		range,
		from: firstWeekISO,
		to: lastWeekISO,
		weeklyData,
		totals,
		wasteQuote,
		topWaste
	};
}
