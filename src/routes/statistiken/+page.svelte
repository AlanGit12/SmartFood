<script>
	import SummaryCard from '$lib/components/SummaryCard.svelte';

	export let data;

	function formatCHF(n) {
		const x = Number(n || 0);
		return `${x.toFixed(2)} CHF`;
	}

	function labelDate(iso) {
		// iso: YYYY-MM-DD -> DD.MM
		if (!iso) return '';
		const [y, m, d] = String(iso).split('-');
		return `${d}.${m}`;
	}

	// max value für Balken
	$: maxDayValue = Math.max(
		1,
		...(data.daily ?? []).map((d) => (d.purchasedValue || 0) + (d.consumedValue || 0) + (d.disposedValue || 0))
	);
</script>

<section class="page-header">
	<div>
		<h1>Statistiken</h1>
		<p class="subtitle">Übersicht über Ausgaben, Konsum und Food Waste (CHF).</p>
	</div>
</section>

<section class="kpi-row">
	<SummaryCard
		title="Ausgegeben"
		value={formatCHF(data.overview?.spentCHF)}
		subtitle="Summe aller Käufe (purchased)"
		icon="🛒"
		variant="money"
	/>

	<SummaryCard
		title="Konsumiert"
		value={formatCHF(data.overview?.consumedCHF)}
		subtitle="Wert der verbrauchten Produkte"
		icon="🍽️"
		variant="default"
	/>

	<SummaryCard
		title="Entsorgt"
		value={formatCHF(data.overview?.wastedCHF)}
		subtitle={`Waste-Rate: ${((data.overview?.wasteRate || 0) * 100).toFixed(0)}%`}
		icon="🗑️"
		variant="warning"
	/>
</section>

<section class="grid">
	<article class="panel">
		<header class="panel-header">
			<h2>Verlauf (Wert pro Tag)</h2>
			<p class="hint">🛒 = gekauft, 🍽️ = konsumiert, 🗑️ = entsorgt</p>
		</header>

		<div class="mini-chart">
			{#each (data.daily ?? []) as d (d.day)}
				<div class="row">
					<div class="day">{labelDate(d.day)}</div>

					<div
						class="bars"
						title={`Gekauft: ${formatCHF(d.purchasedValue)} | Konsumiert: ${formatCHF(d.consumedValue)} | Entsorgt: ${formatCHF(d.disposedValue)}`}
					>
						<div class="bar purchased" style={`width:${((d.purchasedValue / maxDayValue) * 100).toFixed(2)}%`}></div>
						<div class="bar consumed" style={`width:${((d.consumedValue / maxDayValue) * 100).toFixed(2)}%`}></div>
						<div class="bar disposed" style={`width:${((d.disposedValue / maxDayValue) * 100).toFixed(2)}%`}></div>
					</div>

					<div class="sum">
						{formatCHF((d.purchasedValue || 0) + (d.consumedValue || 0) + (d.disposedValue || 0))}
					</div>
				</div>
			{/each}
		</div>

		<footer class="legend">
			<span><span class="dot purchased"></span> gekauft</span>
			<span><span class="dot consumed"></span> konsumiert</span>
			<span><span class="dot disposed"></span> entsorgt</span>
		</footer>
	</article>
</section>

<style>
	.page-header {
		margin-bottom: 1rem;
	}
	h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.6rem;
	}
	.subtitle {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.kpi-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.panel {
		background: white;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		padding: 1.25rem 1.5rem;
	}

	.panel-header {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.hint {
		margin: 0;
		color: #6b7280;
		font-size: 0.85rem;
	}

	.mini-chart {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		margin-top: 0.5rem;
	}

	.row {
		display: grid;
		grid-template-columns: 54px 1fr 110px;
		align-items: center;
		gap: 0.75rem;
	}

	.day {
		color: #6b7280;
		font-size: 0.85rem;
	}

	.bars {
		height: 10px;
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.bar {
		height: 10px;
		border-radius: 999px;
	}

	.bar.purchased {
		background: #3b82f6; /* blau */
	}

	.bar.consumed {
		background: #16a34a; /* grün */
	}

	.bar.disposed {
		background: #ef4444; /* rot */
	}

	.sum {
		text-align: right;
		font-variant-numeric: tabular-nums;
		color: #111827;
		font-weight: 600;
	}

	.legend {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		color: #6b7280;
		font-size: 0.85rem;
	}

	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 999px;
		margin-right: 0.35rem;
	}

	.dot.purchased { background: #3b82f6; }
	.dot.consumed { background: #16a34a; }
	.dot.disposed { background: #ef4444; }

	@media (max-width: 640px) {
		.row {
			grid-template-columns: 48px 1fr 90px;
		}
	}
</style>
