// src/lib/emoji-food-map.js

// Basis-Mapping: "Kernwort" → Emoji
// Alle Keys sind kleingeschrieben!
export const FOOD_EMOJIS = {
	// Obst
	apfel: '🍎',
	'grüner apfel': '🍏',
	birne: '🍐',
	banane: '🍌',
	trauben: '🍇',
	melone: '🍉',
	wassermelone: '🍉',
	'pfirsich': '🍑',
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
	'kartoffelchips': '🍟',
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
	'frischkäse': '🧀',
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
	'döner': '🥙',
	kebab: '🥙',
	falafel: '🧆',
	'hot dog': '🌭',

	// Snacks & Süßes
	schokolade: '🍫',
	'keks': '🍪',
	kekse: '🍪',
	donut: '🍩',
	kuchen: '🍰',
	torte: '🍰',
	muffin: '🧁',
	eis: '🍨',
	eiskugel: '🍨',
	'soft-eis': '🍦',
	'gummibärchen': '🍬',
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
	'sojasauce': '🧂',
	'soja-sauce': '🧂',
	honig: '🍯',
	'nuss-nougat-creme': '🍫',
	'aufstrich': '🍯'
};

// Zusätzliche Synonyme / Mehrwort-Kombis → auf Basis-Keys mappen
// (damit "rote äpfel" trotzdem den Eintrag "apfel" nutzt)
export const FOOD_SYNONYMS = {
	'rote äpfel': 'apfel',
	'rote apfel': 'apfel',
	'apfel rot': 'apfel',
	'grüne äpfel': 'grüner apfel',
	'green apple': 'grüner apfel',

	'kartoffelbrei': 'kartoffel',
	'stampfkartoffeln': 'kartoffel',
	'ofen-kartoffeln': 'kartoffel',

	'blattsalat mix': 'salat',
	'salatmix': 'salat',
	'römersalat': 'salat',

	'vollkornbrot': 'brot',
	'toastbrot': 'brot',
	'toast': 'brot',

	'magerquark': 'quark',
	'griechischer joghurt': 'joghurt',

	'hühnerbrust': 'hähnchen',
	'hähnchenbrust': 'hähnchen',
	'putenbrust': 'pute',

	'vanilleeis': 'eis',
	'schokoladeneis': 'eis',
	'erdbeereis': 'eis',

	'mineralwasser': 'wasser',
	'stilles wasser': 'wasser',
	'sprudelwasser': 'wasser',

	'orangen-saft': 'orangensaft',
	'apfel-saft': 'apfelsaft'
};

/**
 * Versucht, für einen Produktnamen ein passendes Emoji zu finden.
 * - nutzt FOOD_SYNONYMS (genaue Matches)
 * - durchsucht FOOD_EMOJIS per "enthält"-Suche
 * - fallback, wenn nichts gefunden wurde
 */
export function getFoodEmoji(name, fallback = '🍽️') {
	if (!name) return fallback;

	const text = name.toLowerCase().trim();

	// 1) direkte Synonyme
	if (FOOD_SYNONYMS[text]) {
		const baseKey = FOOD_SYNONYMS[text];
		if (FOOD_EMOJIS[baseKey]) return FOOD_EMOJIS[baseKey];
	}

	// 2) exakter Treffer
	if (FOOD_EMOJIS[text]) {
		return FOOD_EMOJIS[text];
	}

	// 3) fuzzy: wenn das Basiswort im Namen vorkommt
	for (const key of Object.keys(FOOD_EMOJIS)) {
		if (text.includes(key)) {
			return FOOD_EMOJIS[key];
		}
	}

	return fallback;
}
