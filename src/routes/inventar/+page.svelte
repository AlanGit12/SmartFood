<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import SummaryCard from '$lib/components/SummaryCard.svelte';
import { MS_PER_DAY, utcToday, toUtcDay, getEarliestExpirationUtc } from '$lib/utils/date.js';

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

	// =========================================================
	// ✅ "Bald ablaufend" Schwelle (persistiert)
	// =========================================================
	const STORAGE_KEY = 'soonThresholdDays';
	let soonThresholdDays = 3;
	$: soonThresholdDaysNum = Math.min(30, Math.max(1, Number(soonThresholdDays) || 3));

	onMount(() => {
		if (!browser) return;

		const raw = localStorage.getItem(STORAGE_KEY);
		const saved = Number(raw);

		if (Number.isFinite(saved) && saved >= 1 && saved <= 30) {
			soonThresholdDays = saved;
		} else {
			soonThresholdDays = 3;
			localStorage.setItem(STORAGE_KEY, '3');
		}
	});

	function onSoonThresholdInput(e) {
		const v = Number(e.currentTarget.value);
		const next = Number.isFinite(v) ? Math.min(30, Math.max(1, v)) : 3;
		soonThresholdDays = next;

		if (browser) localStorage.setItem(STORAGE_KEY, String(next));
	}

	// =========================================================
	// Helper: Wert
	// =========================================================
	function productTotalValue(p) {
		return (Number(p.totalQuantity) || 0) * (Number(p.pricePerUnit) || 0);
	}

	// =========================================================
	// ✅ Datum robust → UTC-Day
	// =========================================================

	


	// =========================================================
	// Filter
	// =========================================================
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

		const earliestUtc = getEarliestExpirationUtc(p);
		if (earliestUtc === null) return true;

		const todayUtc = utcToday();
		const diffDays = (earliestUtc - todayUtc) / MS_PER_DAY;

		if (expiryFilter === 'expired') return diffDays < 0;
		if (expiryFilter === 'soon') return diffDays >= 0 && diffDays <= soonThresholdDaysNum;
		if (expiryFilter === 'later') return diffDays > soonThresholdDaysNum;
		return true;
	}

	// =========================================================
	// 1) Filtern
	// =========================================================
	$: filteredProducts = (products ?? []).filter((product) => {
		const matchesSearch =
			!searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesStorage =
			storageFilter === 'all' || product.storageLocation === storageFilter;

		return matchesSearch && matchesStorage && matchesPrice(product) && matchesExpiry(product);
	});

	// =========================================================
	// 2) Sortieren (nur allAsc/allDesc)
	// =========================================================
	$: displayedProducts = [...filteredProducts].sort((a, b) => {
		if (priceFilter === 'allAsc') return productTotalValue(a) - productTotalValue(b);
		if (priceFilter === 'allDesc') return productTotalValue(b) - productTotalValue(a);
		return 0;
	});

	// =========================================================
	// KPIs
	// =========================================================
	$: totalProducts = displayedProducts.length;

	$: expiringSoon = (() => {
		const todayUtc = utcToday();
		let sum = 0;

		for (const p of displayedProducts) {
			for (const v of p.variants ?? []) {
				const expUtc = toUtcDay(v.expirationDate);
				if (expUtc === null) continue;

				const diffDays = (expUtc - todayUtc) / MS_PER_DAY;
				if (diffDays >= 0 && diffDays <= soonThresholdDaysNum) sum += 1; // zählt Varianten
			}
		}
		return sum;
	})();

	$: totalValue = displayedProducts.reduce((sum, p) => sum + productTotalValue(p), 0);

	// =========================================================
	// 3) Gruppieren
	// =========================================================
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


	function onSelectTemplate(t) {
	// bewusst gewählt → alles übernehmen
	touched = {
		icon: false,
		unit: false,
		amountPerUnit: false,
		storageLocation: false,
		pricePerUnit: false
	};

	// ✅ Name bei expliziter Auswahl übernehmen
	name = t.name || name;

	applyTemplate(t, { onlyIfUntouched: false });
}

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

		<div class="soon-setting">
			<span>Bald ablaufend ab</span>
			<input type="number" min="1" max="30" value={soonThresholdDaysNum} on:input={onSoonThresholdInput} />
			<span>Tagen</span>
		</div>
	</div>
</section>

<section class="kpi-row">
	<SummaryCard title="Anzahl Produkte" value={totalProducts} subtitle="verschiedene Artikel im Inventar" icon="📦" variant="default" />
	<SummaryCard title="Bald ablaufend" value={expiringSoon} subtitle="Varianten innerhalb der Schwelle" icon="🟠" variant="warning" />
	<SummaryCard title="Wert der Produkte" value={`${totalValue.toFixed(2)} CHF`} subtitle="geschätzter Gesamtwert" icon="💶" variant="money" />
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
							soonThresholdDays={soonThresholdDaysNum}
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
						soonThresholdDays={soonThresholdDaysNum}
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
		white-space: nowrap;
	}

	.add-button span {
		font-size: 1.2rem;
	}

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
