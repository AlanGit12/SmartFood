// src/lib/emoji-food-map.js

/**
 * Basis-Mapping: "Kernwort" → Emoji
 * Keys sind kleingeschrieben.
 */
export const FOOD_EMOJIS = {
	// Obst
	apfel: '🍎',
	'grüner apfel': '🍏',
	birne: '🍐',
	banane: '🍌',
	trauben: '🍇',
	melone: '🍉',
	wassermelone: '🍉',
	pfirsich: '🍑',
	erdbeere: '🍓',
	zitrone: '🍋',
	lime: '🍋',
	orange: '🍊',
	mandarine: '🍊',
	ananas: '🍍',
	kiwi: '🥝',
	kirsche: '🍒',
	kirschen: '🍒',
	heidelbeere: '🫐',
	blaubeere: '🫐',
	avocado: '🥑',
	kokosnuss: '🥥',

	// Gemüse
	karotte: '🥕',
	karotten: '🥕',
	kartoffel: '🥔',
	kartoffeln: '🥔',
	zwiebel: '🧅',
	knoblauch: '🧄',
	paprika: '🫑',
	tomate: '🍅',
	salat: '🥬',
	blattsalat: '🥬',
	kohl: '🥬',
	brokkoli: '🥦',
	spinat: '🥬',
	champignons: '🍄',
	pilz: '🍄',
	mais: '🌽',
	gurke: '🥒',
	zucchini: '🥒',
	olive: '🫒',
	oliven: '🫒',
	chili: '🌶️',

	// Brot, Getreide, Beilagen
	brot: '🍞',
	brötchen: '🥐',
	croissant: '🥐',
	brezel: '🥨',
	reis: '🍚',
	risotto: '🍚',
	nudeln: '🍝',
	pasta: '🍝',
	spaghetti: '🍝',
	pizza: '🍕',
	tortilla: '🌯',
	wrap: '🌯',
	sandwich: '🥪',
	burger: '🍔',
	pommes: '🍟',
	kartoffelchips: '🍟',
	'kartoffel-wedges': '🍟',
	cerealien: '🥣',
	haferflocken: '🥣',

	// Milchprodukte
	milch: '🥛',
	joghurt: '🥛',
	quark: '🥛',
	sahne: '🥛',
	rahm: '🥛',
	käse: '🧀',
	mozarella: '🧀',
	parmesan: '🧀',
	frischkäse: '🧀',
	butter: '🧈',

	// Eier, Fleisch, Fisch
	ei: '🥚',
	eier: '🥚',
	omelett: '🍳',
	spiegelei: '🍳',
	fleisch: '🥩',
	steak: '🥩',
	würstchen: '🌭',
	wurst: '🌭',
	hähnchen: '🍗',
	huhn: '🍗',
	pute: '🍗',
	fisch: '🐟',
	lachs: '🐟',
	thunfisch: '🐟',
	garnele: '🦐',
	shrimp: '🦐',

	// Fertiggerichte & Warmes
	suppe: '🍲',
	eintopf: '🍲',
	curry: '🍛',
	ramen: '🍜',
	'nudel-suppe': '🍜',
	döner: '🥙',
	kebab: '🥙',
	falafel: '🧆',
	'hot dog': '🌭',

	// Snacks & Süßes
	schokolade: '🍫',
	keks: '🍪',
	kekse: '🍪',
	donut: '🍩',
	kuchen: '🍰',
	torte: '🍰',
	muffin: '🧁',
	eis: '🍨',
	eiskugel: '🍨',
	'soft-eis': '🍦',
	gummibärchen: '🍬',
	bonbon: '🍬',

	// Getränke
	wasser: '💧',
	tee: '🍵',
	kaffee: '☕',
	cappuccino: '☕',
	cola: '🥤',
	limonade: '🥤',
	saft: '🧃',
	orangensaft: '🧃',
	apfelsaft: '🧃',
	smoothie: '🥤',

	// Sonstiges Küchenzeug
	öl: '🫙',
	olivenöl: '🫙',
	essig: '🫙',
	gewürz: '🧂',
	salz: '🧂',
	pfeffer: '🧂',
	sojasauce: '🧂',
	'soja-sauce': '🧂',
	honig: '🍯',
	'nuss-nougat-creme': '🍫',
	aufstrich: '🍯'
};

/**
 * Zusätzliche Synonyme / Mehrwort-Kombis → auf Basis-Keys mappen.
 */
export const FOOD_SYNONYMS = {
	'rote äpfel': 'apfel',
	'rote apfel': 'apfel',
	'apfel rot': 'apfel',
	'grüne äpfel': 'grüner apfel',
	'green apple': 'grüner apfel',

	kartoffelbrei: 'kartoffel',
	stampfkartoffeln: 'kartoffel',
	'ofen-kartoffeln': 'kartoffel',

	'blattsalat mix': 'salat',
	salatmix: 'salat',
	römersalat: 'salat',

	vollkornbrot: 'brot',
	toastbrot: 'brot',
	toast: 'brot',

	magerquark: 'quark',
	'griechischer joghurt': 'joghurt',

	hühnerbrust: 'hähnchen',
	hähnchenbrust: 'hähnchen',
	putenbrust: 'pute',

	vanilleeis: 'eis',
	schokoladeneis: 'eis',
	erdbeereis: 'eis',

	mineralwasser: 'wasser',
	'stilles wasser': 'wasser',
	sprudelwasser: 'wasser',

	'orangen-saft': 'orangensaft',
	'apfel-saft': 'apfelsaft',

	// ✅ extra robuste Schreibweisen
	haehnchen: 'hähnchen',
	haehnchenbrust: 'hähnchen',
	kaese: 'käse',
	frischkaese: 'frischkäse'
};

/**
 * ✅ Für Emoji-Picker: eindeutige Emojis aus dem Mapping (sortiert)
 */
export const FOOD_EMOJI_LIST = Array.from(new Set(Object.values(FOOD_EMOJIS))).sort();

/**
 * Normalisierung:
 * - lowercase
 * - trim
 * - Umlaute/ß vereinheitlichen, damit "Hähnchen" == "Haehnchen"
 * - doppelte Spaces raus
 */
function normalize(s) {
	return String(s || '')
		.trim()
		.toLowerCase()
		.replaceAll('ä', 'ae')
		.replaceAll('ö', 'oe')
		.replaceAll('ü', 'ue')
		.replaceAll('ß', 'ss')
		.replace(/\s+/g, ' ');
}

/**
 * Versucht, für einen Produktnamen ein passendes Emoji zu finden.
 * Reihenfolge:
 * 1) Synonym exakt (normalisiert)
 * 2) Exakter Treffer im Basis-Mapping (normalisiert)
 * 3) Fuzzy: "enthält" Basis-Key
 * 4) Fuzzy: "enthält" Synonym-Key → mapped auf Basis-Key
 * 5) fallback
 */
export function getFoodEmoji(name, fallback = '🍽️') {
	if (!name) return fallback;

	const text = normalize(name);

	// 1) Synonym exakt
	const synBase = FOOD_SYNONYMS[text];
	if (synBase) {
		const baseKey = normalize(synBase);
		// baseKey muss zu einem FOOD_EMOJIS Key gemappt werden -> wir suchen den echten Key
		for (const k of Object.keys(FOOD_EMOJIS)) {
			if (normalize(k) === baseKey) return FOOD_EMOJIS[k];
		}
	}

	// 2) Exakt im Basis-Mapping
	for (const k of Object.keys(FOOD_EMOJIS)) {
		if (normalize(k) === text) return FOOD_EMOJIS[k];
	}

	// 3) Fuzzy Basis-Mapping
	for (const k of Object.keys(FOOD_EMOJIS)) {
		const nk = normalize(k);
		if (nk && text.includes(nk)) return FOOD_EMOJIS[k];
	}

	// 4) Fuzzy Synonyme
	for (const syn of Object.keys(FOOD_SYNONYMS)) {
		const ns = normalize(syn);
		if (ns && text.includes(ns)) {
			const mapped = FOOD_SYNONYMS[syn];
			const mappedN = normalize(mapped);
			for (const k of Object.keys(FOOD_EMOJIS)) {
				if (normalize(k) === mappedN) return FOOD_EMOJIS[k];
			}
		}
	}

	return fallback;
}
