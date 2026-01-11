export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function formatDate(value) {
	if (!value) return '-';

	if (value instanceof Date) {
		const d = String(value.getDate()).padStart(2, '0');
		const m = String(value.getMonth() + 1).padStart(2, '0');
		const y = value.getFullYear();
		return `${d}.${m}.${y}`;
	}

	const s = String(value);

	// "YYYY-MM-DD"
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
		const [y, m, d] = s.split('-');
		return `${d}.${m}.${y}`;
	}

	// ISO: "YYYY-MM-DDT..."
	if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
		const [datePart] = s.split('T');
		const [y, m, d] = datePart.split('-');
		return `${d}.${m}.${y}`;
	}

	// "DD.MM.YYYY" (already)
	return s;
}

export function toUtcDay(value) {
	if (value instanceof Date) {
		return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
	}

	if (typeof value === 'string') {
		const normalized = value.includes('T') ? value.split('T')[0] : value;

		if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
			const [y, m, d] = normalized.split('-').map(Number);
			return Date.UTC(y, m - 1, d);
		}

		if (/^\d{2}\.\d{2}\.\d{4}$/.test(normalized)) {
			const [d, m, y] = normalized.split('.').map(Number);
			return Date.UTC(y, m - 1, d);
		}
	}

	return null;
}

export function utcToday() {
	const now = new Date();
	return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getVariantStatus(expirationDate, soonThresholdDays = 3) {
	const expUtc = toUtcDay(expirationDate);
	if (expUtc === null) return 'ok';

	const todayUtc = utcToday();
	const diffDays = (expUtc - todayUtc) / MS_PER_DAY;

	if (diffDays < 0) return 'expired';
	if (diffDays <= soonThresholdDays) return 'soon';
	return 'ok';
}

export function getEarliestExpirationUtc(product) {
	let earliest = null;
	for (const v of product.variants ?? []) {
		const u = toUtcDay(v.expirationDate);
		if (u === null) continue;
		if (earliest === null || u < earliest) earliest = u;
	}
	return earliest;
}
