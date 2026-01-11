export function roundToStep(value, step) {
	return Math.round(value / step) * step;
}

export function packsFromRemaining(remainingAmount, packSize) {
	const amt = Number(remainingAmount || 0);
	const size = Number(packSize || 0);
	if (!size || size <= 0 || amt <= 0) return 0;
	return Math.ceil(amt / size);
}

export function calcTotalQuantity({ variants = [], packUnit = null, packSize = null }) {
	const isPack = Boolean(packUnit && packSize);
	if (isPack) return variants.reduce((sum, v) => sum + packsFromRemaining(v.remainingAmount, packSize), 0);
	return variants.reduce((sum, v) => sum + Number(v.piecesRemaining || 0), 0);
}

export function normalizePackUnit(unit) {
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

export function mapProductDoc(doc) {
	const variants = doc.variants ?? [];
	const packUnit = doc.packUnit ?? null;
	const packSize = doc.packSize ?? null;

	const totalQuantity = calcTotalQuantity({ variants, packUnit, packSize });

	return {
		id: doc._id.toString(),
		normalizedName: doc.normalizedName ?? doc.name?.toLowerCase() ?? '',
		name: doc.name,
		icon: doc.icon ?? '🥕',
		storageLocation: doc.storageLocation ?? 'Kühlschrank',
		pricePerUnit: doc.pricePerUnit ?? 0,

		packUnit,
		packSize,
		displayUnit: doc.displayUnit ?? 'Stück',
		amountPerUnitDisplay: doc.amountPerUnitDisplay ?? 0,

		variants,
		totalQuantity
	};
}

/**
 * Event-Logging (zentral)
 * type: 'purchased' | 'consumed' | 'disposed'
 */
export async function logProductEvent(db, { product, type, unit, quantity, value }) {
	const q = Number(quantity || 0);
	if (!type || q <= 0) return;

	await db.collection('productEvents').insertOne({
		productId: product._id.toString(),
		normalizedName: product.normalizedName ?? product.name?.toLowerCase() ?? '',
		name: product.name,
		type,
		unit,
		quantity: q,
		value: Number(value || 0),
		createdAt: new Date()
	});
}
