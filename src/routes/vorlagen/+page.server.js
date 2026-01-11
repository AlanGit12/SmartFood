import { getDb } from '$lib/server/db.js';
import { fail, redirect } from '@sveltejs/kit';
import { ObjectId } from 'mongodb';
import { getStorageLocations } from '$lib/server/storageLocations.js';


$: locations = data.locations ?? [];


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

export async function load() {
	const db = await getDb();
const locations = await getStorageLocations();
	const templates = await db.collection('productTemplates').find({}).sort({ name: 1 }).toArray();

	return {
		templates: templates.map((t) => ({
			id: t._id.toString(),
			name: t.name ?? '',
			normalizedName: t.normalizedName ?? (t.name ?? '').toLowerCase(),
			icon: t.icon ?? '🥕',

			displayUnit: t.displayUnit ?? 'Stück',
			amountPerUnitDisplay: Number(t.amountPerUnitDisplay ?? 1),

			defaultStorageLocation: t.defaultStorageLocation ?? 'Kühlschrank',
			defaultPricePerUnit: Number(t.defaultPricePerUnit ?? 0)
		}))
	};
}

function parseTemplateForm(fd) {
	const name = String(fd.get('name') || '').trim();
	const icon = String(fd.get('icon') || '🥕');

	// ✅ WICHTIG: displayUnit IMMER definieren
	const displayUnit = String(fd.get('displayUnit') || 'Stück');
	let amountPerUnitDisplay = Number(fd.get('amountPerUnitDisplay') || 0);

	const defaultStorageLocation = String(fd.get('defaultStorageLocation') || 'Kühlschrank');

	const rawPrice = Number(fd.get('defaultPricePerUnit') || 0);
	const defaultPricePerUnit = roundToStep(Number.isFinite(rawPrice) ? rawPrice : 0, 0.05);

	if (!Number.isFinite(amountPerUnitDisplay)) amountPerUnitDisplay = 0;

	// normalize pack info
	const { packUnit, factorToBase } = normalizePackUnit(displayUnit);

	// ✅ Regel: Stück => immer 1
	if (!packUnit) {
		amountPerUnitDisplay = 1;
	} else {
		if (!amountPerUnitDisplay || amountPerUnitDisplay <= 0) {
			return { error: 'Menge pro Einheit muss > 0 sein.', ok: false };
		}
	}

	const packSize = packUnit ? amountPerUnitDisplay * factorToBase : null;

	return {
		ok: true,
		name,
		icon,
		displayUnit,
		amountPerUnitDisplay,
		packUnit,
		packSize,
		defaultStorageLocation,
		defaultPricePerUnit,
		normalizedName: name.toLowerCase()
	};
}

export const actions = {
	create: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();

		const parsed = parseTemplateForm(fd);
		if (!parsed.ok) return fail(400, { message: parsed.error });

		if (!parsed.name) return fail(400, { message: 'Name fehlt.' });

		await db.collection('productTemplates').updateOne(
			{ normalizedName: parsed.normalizedName },
			{
				$set: {
					name: parsed.name,
					normalizedName: parsed.normalizedName,
					icon: parsed.icon,

					displayUnit: parsed.displayUnit,
					amountPerUnitDisplay: parsed.amountPerUnitDisplay,
					packUnit: parsed.packUnit,
					packSize: parsed.packSize,

					defaultStorageLocation: parsed.defaultStorageLocation,
					defaultPricePerUnit: parsed.defaultPricePerUnit,

					updatedAt: new Date()
				},
				$setOnInsert: { createdAt: new Date() }
			},
			{ upsert: true }
		);

		throw redirect(303, '/vorlagen');
	},

	update: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();

		const templateId = String(fd.get('templateId') || '');
		if (!templateId) return fail(400, { message: 'templateId fehlt.' });

		let _id;
		try {
			_id = new ObjectId(templateId);
		} catch {
			return fail(400, { message: 'Ungültige templateId.' });
		}

		const parsed = parseTemplateForm(fd);
		if (!parsed.ok) return fail(400, { message: parsed.error });

		if (!parsed.name) return fail(400, { message: 'Name fehlt.' });

		await db.collection('productTemplates').updateOne(
			{ _id },
			{
				$set: {
					name: parsed.name,
					normalizedName: parsed.normalizedName,
					icon: parsed.icon,

					displayUnit: parsed.displayUnit,
					amountPerUnitDisplay: parsed.amountPerUnitDisplay,
					packUnit: parsed.packUnit,
					packSize: parsed.packSize,

					defaultStorageLocation: parsed.defaultStorageLocation,
					defaultPricePerUnit: parsed.defaultPricePerUnit,

					updatedAt: new Date()
				}
			}
		);

		throw redirect(303, '/vorlagen');
	},

	delete: async ({ request }) => {
		const db = await getDb();
		const fd = await request.formData();

		const templateId = String(fd.get('templateId') || '');
		if (!templateId) return fail(400, { message: 'templateId fehlt.' });

		let _id;
		try {
			_id = new ObjectId(templateId);
		} catch {
			return fail(400, { message: 'Ungültige templateId.' });
		}

		await db.collection('productTemplates').deleteOne({ _id });

		throw redirect(303, '/vorlagen');
	}
};
