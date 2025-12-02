<script>
	export let data;

	const { waste, consumed, monthlySpend, categoryStats } = data;

	// Helfer zum Formatieren
	function formatCHF(value) {
		return `${value.toFixed(2)} CHF`;
	}
</script>

<h1>Statistik</h1>
<p class="subtitle">
	Analysen über Verbrauch, Entsorgung und deine Ausgaben.
</p>

<!-- ========================================================= -->
<!-- KARTEN -->
<!-- ========================================================= -->

<section class="kpi-row">
	<div class="card">
		<h3>Entsorgt</h3>
		<p class="value">{waste.length}</p>
		<p class="info">Einträge insgesamt</p>
	</div>

	<div class="card">
		<h3>Verbraucht</h3>
		<p class="value">{consumed.length}</p>
		<p class="info">Einträge insgesamt</p>
	</div>

	<div class="card">
		<h3>Monatliche Ausgaben</h3>
		<p class="value">
			{monthlySpend.length > 0
				? formatCHF(monthlySpend.at(-1).total)
				: '0 CHF'}
		</p>
		<p class="info">letzter Monat</p>
	</div>
</section>

<!-- ========================================================= -->
<!-- FOOD WASTE VERLAUF -->
<!-- ========================================================= -->

<section class="chart-card">
	<h2>Food Waste Verlauf</h2>
	<p class="chart-info">
		Entsorgte Produkte im Zeitverlauf
	</p>

	{#if waste.length === 0}
		<p>Keine Entsorgungen vorhanden.</p>
	{:else}
		<div class="chart">
			{#each waste as entry}
				<div class="bar" title={entry.date}></div>
			{/each}
		</div>
	{/if}
</section>

<!-- ========================================================= -->
<!-- MONATSAUSGABEN -->
<!-- ========================================================= -->

<section class="chart-card">
	<h2>Ausgaben nach Monat</h2>

	{#if monthlySpend.length === 0}
		<p>Keine Einkäufe erfasst.</p>
	{:else}
		<ul class="list">
			{#each monthlySpend as m}
				<li>
					<strong>{m._id}</strong>: {formatCHF(m.total)}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<!-- ========================================================= -->
<!-- INVENTAR NACH ORT -->
<!-- ========================================================= -->

<section class="chart-card">
	<h2>Produkte nach Aufbewahrungsort</h2>

	<ul class="list">
		{#each Object.entries(categoryStats) as [key, value]}
			<li>
				<strong>{key}</strong>: {value}
			</li>
		{/each}
	</ul>
</section>

<style>
	h1 { margin-bottom: 0.25rem; }
	.subtitle {
		color: #6b7280;
		margin-bottom: 1.5rem;
	}

	.kpi-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.card {
		background: #fff;
		border-radius: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
	}

	.card .value {
		font-size: 1.8rem;
		font-weight: bold;
		margin: 0.4rem 0;
	}

	.chart-card {
		background: white;
		padding: 1.25rem;
		border-radius: 1rem;
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.chart {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 120px;
		margin-top: 1rem;
	}

	.bar {
		height: 100%;
		width: 10px;
		background: #ef4444;
		border-radius: 4px;
	}

	.list {
		list-style: none;
		padding: 0;
	}

	.list li {
		padding: 0.25rem 0;
		border-bottom: 1px solid #f3f4f6;
	}
</style>
