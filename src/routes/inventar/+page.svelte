<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';

	export let data;
	const { products } = data;

	let searchTerm = '';
	let storageFilter = 'all';

	/**
	 * priceFilter:
	 * - all      -> keine Sortierung, keine Preisfilterung
	 * - allAsc   -> keine Preisfilterung, Sortierung nach Gesamtwert (aufsteigend)
	 * - allDesc  -> keine Preisfilterung, Sortierung nach Gesamtwert (absteigend)
	 * - low/mid/high -> Preisfilterung, keine Sortierung
	 */
	let priceFilter = 'all';

	let expiryFilter = 'all';
	let groupByLocation = false;

	// ✅ user-einstellbare Schwelle "bald ablaufend"
	let soonThresholdDays = 3;

	onMount(() => {
		if (!browser) return;
		const saved = Number(localStorage.getItem('soonThresholdDays'));
		if (!Number.isNaN(saved) && saved > 0) soonThresholdDays = saved;
	});

	$: if (browser) {
		localStorage.setItem('soonThresholdDays', String(soonThresholdDays));
	}

	// ---------- Helper ----------
	function productTotalValue(p) {
		return (p.totalQuantity || 0) * (p.pricePerUnit || 0);
	}

	function parseDate(dateStr) {
		if (!dateStr) return null;
		const parts = dateStr.split('-');
		if (parts.length !== 3) return null;
		const [y, m, d] = parts.map(Number);
		return new Date(y, m - 1, d);
	}

	function getEarliestExpiration(product) {
		if (!product.variants || product.variants.length === 0) return null;
		const dates = product.variants
			.map((v) => parseDate(v.expirationDate))
			.filter((d) => d instanceof Date && !isNaN(d));
		if (dates.length === 0) return null;
		return dates.reduce((min, d) => (d < min ? d : min), dates[0]);
	}

	function matchesPrice(p) {
		const value = productTotalValue(p);

		if (priceFilter === 'all' || priceFilter === 'allAsc' || priceFilter === 'allDesc') return true;
		if (priceFilter === 'low') return value < 5;
		if (priceFilter === 'mid') return value >= 5 && value <= 20;
		if (priceFilter === 'high') return value > 20;
		return true;
	}

	function matchesExpiry(p) {
		if (expiryFilter === 'all') return true;

		const earliest = getEarliestExpiration(p);
		if (!earliest) return true;

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const diffDays = (earliest - today) / (1000 * 60 * 60 * 24);

		if (expiryFilter === 'expired') return diffDays < 0;
		if (expiryFilter === 'soon') return diffDays >= 0 && diffDays <= soonThresholdDays;
		if (expiryFilter === 'later') return diffDays > soonThresholdDays;
		return true;
	}

	// ---------- 1) Filtern ----------
	$: filteredProducts = products.filter((product) => {
		const matchesSearch =
			!searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStorage =
			storageFilter === 'all' || product.storageLocation === storageFilter;

		return matchesSearch && matchesStorage && matchesPrice(product) && matchesExpiry(product);
	});

	// ---------- 2) Sortieren (nur allAsc/allDesc) ----------
	$: displayedProducts = [...filteredProducts].sort((a, b) => {
		if (priceFilter === 'allAsc') return productTotalValue(a) - productTotalValue(b);
		if (priceFilter === 'allDesc') return productTotalValue(b) - productTotalValue(a);
		return 0;
	});

	// ---------- KPIs ----------
	$: totalProducts = displayedProducts.length;

	$: expiringSoon = (() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		let sum = 0;

		for (const p of displayedProducts) {
			for (const v of (p.variants ?? [])) {
				const exp = parseDate(v.expirationDate);
				if (!exp) continue;
				exp.setHours(0, 0, 0, 0);

				const diffDays = (exp - today) / (1000 * 60 * 60 * 24);
				if (diffDays >= 0 && diffDays <= soonThresholdDays) sum += 1; // zählt Varianten
			}
		}
		return sum;
	})();

	$: totalValue = displayedProducts.reduce((sum, product) => sum + productTotalValue(product), 0);

	// ---------- Gruppierung ----------
	const storageOrder = ['Kühlschrank', 'Vorratsschrank', 'Tiefkühler'];

	$: groupedProducts = (() => {
		const map = new Map();

		for (const p of displayedProducts) {
			const loc = p.storageLocation || 'Sonstiger Ort';
			if (!map.has(loc)) map.set(loc, []);
			map.get(loc).push(p);
		}

		const entries = Array.from(map.entries()).map(([location, items]) => ({
			location,
			products: items
		}));

		entries.sort((a, b) => {
			const ia = storageOrder.indexOf(a.location);
			const ib = storageOrder.indexOf(b.location);
			const sa = ia === -1 ? 999 : ia;
			const sb = ib === -1 ? 999 : ib;
			return sa - sb;
		});

		return entries;
	})();
</script>

<section class="inventar-header">
	<div class="title-block">
		<h1>Inventar</h1>
		<p class="subtitle">Behalte den Überblick über deine Lebensmittel.</p>
	</div>

	<div class="toolbar">
		<input
			type="search"
			class="search-input"
			placeholder="Produkt suchen..."
			bind:value={searchTerm}
		/>

		<select class="filter-select" bind:value={storageFilter} aria-label="Nach Aufbewahrungsort filtern">
			<option value="all">Alle Orte</option>
			<option value="Kühlschrank">Kühlschrank</option>
			<option value="Vorratsschrank">Vorratsschrank</option>
			<option value="Tiefkühler">Tiefkühler</option>
		</select>

		<select class="filter-select" bind:value={priceFilter} aria-label="Nach Preis filtern">
			<option value="all">Alle Preise</option>
			<option value="allAsc">Alle Preise (Preis ↑)</option>
			<option value="allDesc">Alle Preise (Preis ↓)</option>
			<option value="low">&lt; 5 CHF</option>
			<option value="mid">5 – 20 CHF</option>
			<option value="high">&gt; 20 CHF</option>
		</select>

		<select class="filter-select" bind:value={expiryFilter} aria-label="Nach Ablaufdatum filtern">
			<option value="all">Alle Ablaufdaten</option>
			<option value="expired">Bereits abgelaufen</option>
			<option value="soon">Läuft bald ab</option>
			<option value="later">Läuft später ab</option>
		</select>

		<label class="group-toggle">
			<input type="checkbox" bind:checked={groupByLocation} />
			<span>Nach Ort gruppieren</span>
		</label>

		<a href="/inventar/neu" class="add-button">
			<span>+</span>
			Produkt hinzufügen
		</a>

		<!-- ✅ compact: bleibt in der Toolbar und zerschießt nichts -->
		<div class="soon-setting">
			<span>Bald ablaufend ab</span>
			<input type="number" min="1" max="30" bind:value={soonThresholdDays} />
			<span>Tagen</span>
		</div>
	</div>
</section>

<section class="kpi-row">
	<SummaryCard
		title="Anzahl Produkte"
		value={totalProducts}
		subtitle="verschiedene Artikel im Inventar"
		icon="📦"
		variant="default"
	/>

	<SummaryCard
		title="Bald ablaufend"
		value={expiringSoon}
		subtitle="Varianten innerhalb der Schwelle"
		icon="🟠"
		variant="warning"
	/>

	<SummaryCard
		title="Wert der Produkte"
		value={`${totalValue.toFixed(2)} CHF`}
		subtitle="geschätzter Gesamtwert"
		icon="💶"
		variant="money"
	/>
</section>

{#if groupByLocation}
	{#if groupedProducts.length === 0}
		<p class="empty">Keine Produkte gefunden. Passe Suche oder Filter an.</p>
	{:else}
		{#each groupedProducts as group}
			<h2 class="location-heading">{group.location}</h2>
			<section class="grid">
				{#each group.products as product (product.id)}
					<form method="POST" class="card-form">
						<input type="hidden" name="productId" value={product.id} />
						<ProductCard
							id={product.id}
							name={product.name}
							icon={product.icon}
							totalQuantity={product.totalQuantity}
							variants={product.variants}
							storageLocation={product.storageLocation}
							pricePerUnit={product.pricePerUnit}
							packUnit={product.packUnit}
							packSize={product.packSize}
							soonThresholdDays={soonThresholdDays}
						/>
					</form>
				{/each}
			</section>
		{/each}
	{/if}
{:else}
	<section class="grid">
		{#if displayedProducts.length === 0}
			<p class="empty">Keine Produkte gefunden. Passe Suche oder Filter an.</p>
		{:else}
			{#each displayedProducts as product (product.id)}
				<form method="POST" class="card-form">
					<input type="hidden" name="productId" value={product.id} />
					<ProductCard
						id={product.id}
						name={product.name}
						icon={product.icon}
						totalQuantity={product.totalQuantity}
						variants={product.variants}
						storageLocation={product.storageLocation}
						pricePerUnit={product.pricePerUnit}
						packUnit={product.packUnit}
						packSize={product.packSize}
						soonThresholdDays={soonThresholdDays}
					/>
				</form>
			{/each}
		{/if}
	</section>
{/if}

<style>
	.inventar-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.title-block h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.6rem;
	}

	.subtitle {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.toolbar {
		display: flex;
		gap: 0.6rem;
		align-items: center;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.search-input {
		min-width: 180px;
		border-radius: 999px;
		border: 1px solid #d1d5db;
		padding: 0.4rem 0.8rem;
		font-size: 0.9rem;
	}

	.filter-select {
		border-radius: 999px;
		border: 1px solid #d1d5db;
		padding: 0.4rem 0.8rem;
		font-size: 0.9rem;
		background: white;
	}

	.group-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.85rem;
		color: #4b5563;
		white-space: nowrap;
	}

	.group-toggle input {
		accent-color: #0f766e;
	}

	.add-button {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		background: #16a34a;
		color: white;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.95rem;
		box-shadow: 0 1px 4px rgba(22, 163, 74, 0.35);
		transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
		white-space: nowrap;
	}

	.add-button span {
		font-size: 1.2rem;
	}

	/* ✅ kompakt & inline in toolbar */
	.soon-setting {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem 0.6rem;
		border-radius: 999px;
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		font-size: 0.85rem;
		color: #4b5563;
		white-space: nowrap;
	}

	.soon-setting input {
		width: 3.6rem;
		border-radius: 0.6rem;
		border: 1px solid #d1d5db;
		padding: 0.2rem 0.35rem;
		font-size: 0.85rem;
		background: white;
	}

	.kpi-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 1.75rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.5rem;
	}

	@media (min-width: 768px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	.card-form {
		margin: 0;
	}

	.empty {
		grid-column: 1 / -1;
		color: #6b7280;
		font-size: 0.95rem;
		text-align: center;
	}

	.location-heading {
		margin: 0 0 0.4rem 0.1rem;
		font-size: 1rem;
		color: #4b5563;
	}
</style>
