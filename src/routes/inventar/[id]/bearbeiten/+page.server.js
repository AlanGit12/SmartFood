import { getDb } from '$lib/server/db.js';
import { ObjectId } from 'mongodb';
import { error, redirect, fail } from '@sveltejs/kit';
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

// Robust: findOne by ObjectId or string
function idQuery(id) {
	try {
		return { $or: [{ _id: new ObjectId(String(id)) }, { _id: String(id) }] };
	} catch {
		return { _id: String(id) };
	}
}

export async function load({ params }) {
  const db = await getDb();
  const locations = await getStorageLocations();

  const doc = await db.collection('products').findOne(idQuery(params.id));
  if (!doc) throw error(404, 'Produkt nicht gefunden');

  const packUnit = doc.packUnit ?? null;
  const packSize = doc.packSize ?? null;
  const displayUnit = doc.displayUnit ?? 'Stück';
  const amountPerUnitDisplay = doc.amountPerUnitDisplay ?? (displayUnit === 'Stück' ? 1 : 0);

  const variants = (doc.variants ?? []).map((v, index) => {
    if (packUnit && packSize) {
      const amt = Number(v.remainingAmount || 0);
      const pieces = amt <= 0 ? 0 : Math.ceil(amt / packSize);
      return {
        id: index + 1,
        quantity: pieces,
        expirationDate: v.expirationDate ?? '',
        status: v.status ?? 'ok'
      };
    }
    return {
      id: index + 1,
      quantity: Number(v.piecesRemaining || 0),
      expirationDate: v.expirationDate ?? '',
      status: v.status ?? 'ok'
    };
  });

  return {
    product: {
      id: doc._id.toString(),
      name: doc.name,
      icon: doc.icon ?? '🥕',
      unit: displayUnit,
      storageLocation: doc.storageLocation ?? 'Kühlschrank',
      pricePerUnit: doc.pricePerUnit ?? 0,
      amountPerUnit: amountPerUnitDisplay,
      variants
    }
  };
}


export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		const name = formData.get('name');
		const icon = formData.get('icon') || '🥕';
		const displayUnit = formData.get('unit') || 'Stück';
		const storageLocation = formData.get('storageLocation');

		const rawPrice = parseFloat(formData.get('pricePerUnit') || '0');
		const pricePerUnit = roundToStep(rawPrice, 0.05);

let amountPerUnitDisplay = parseFloat(formData.get('amountPerUnit') || '0');

		if (!name || !displayUnit || !storageLocation) {
			return fail(400, { message: 'Pflichtfelder fehlen.' });
		}

		const db = await getDb();




		// altes Produkt holen (robust)
		const oldDoc = await db.collection('products').findOne(idQuery(params.id));
		if (!oldDoc) return fail(404, { message: 'Produkt nicht gefunden' });

		const selector = { _id: oldDoc._id };
		const canonicalProductId = oldDoc._id?.toString?.() ?? String(params.id);

		const { packUnit, factorToBase } = normalizePackUnit(displayUnit);

if (!packUnit) {
	amountPerUnitDisplay = 1;
}

const packSize = packUnit ? amountPerUnitDisplay * factorToBase : null;


		const quantities = formData.getAll('variant_quantity');
		const expirations = formData.getAll('variant_expirationDate');

		if (!quantities.length || !expirations.length) {
			return fail(400, { message: 'Mindestens eine Variante wird benötigt.' });
		}

		const variants = quantities.map((q, i) => {
			const pieces = Number(q) || 0;

			if (packUnit) {
				return {
					remainingAmount: pieces * (packSize || 0),
					expirationDate: expirations[i],
					status: 'ok'
				};
			}

			return {
				piecesRemaining: pieces,
				expirationDate: expirations[i],
				status: 'ok'
			};
		});

		const totalQuantity = packUnit
			? variants.reduce((sum, v) => {
					const amt = Number(v.remainingAmount || 0);
					if (!packSize || amt <= 0) return sum;
					return sum + Math.ceil(amt / packSize);
			  }, 0)
			: variants.reduce((sum, v) => sum + Number(v.piecesRemaining || 0), 0);

		const normalizedName = name.trim().toLowerCase();

		// ✅ Delta => purchased
		const oldTotal = Number(oldDoc.totalQuantity || 0);
		const newTotal = Number(totalQuantity || 0);
		const delta = newTotal - oldTotal;

		if (delta > 0) {
			await db.collection('productEvents').insertOne({
				productId: canonicalProductId,
				normalizedName,
				name,
				type: 'purchased',
				unit: 'Stück',
				quantity: delta,
				value: delta * pricePerUnit,
				createdAt: new Date()
			});
		}

		await db.collection('products').updateOne(selector, {
			$set: {
				normalizedName,
				name,
				icon,
				storageLocation,
				pricePerUnit,
				packUnit,
				packSize,
				displayUnit,
				amountPerUnitDisplay,
				variants,
				totalQuantity,
				updatedAt: new Date()
			}
		});

		// Template mitziehen (wie bei dir)
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

		throw redirect(303, '/inventar');
	}
};
