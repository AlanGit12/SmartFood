<script>
	import SummaryCard from '$lib/components/SummaryCard.svelte';
	export let data;

	const ranges = [
		{ v: '1m', l: '1 Monat' },
		{ v: '3m', l: '3 Monate' },
		{ v: '6m', l: '6 Monate' },
		{ v: '12m', l: '12 Monate' }
	];

	$: weekly = data.weeklyData ?? [];

	function chf(n) {
		return `${Number(n || 0).toFixed(2)} CHF`;
	}

	function fmtWeek(iso) {
		// YYYY-MM-DD -> DD.MM
		if (!iso) return '';
		const [, m, d] = String(iso).split('-');
		return `${d}.${m}`;
	}

	// ---------- Chart helpers ----------
	const W = 980;
	const H = 300;
	const P = { l: 70, r: 24, t: 20, b: 54 };
	const innerW = W - P.l - P.r;
	const innerH = H - P.t - P.b;

	const GRID_Y = 4;
	const MAX_X_TICKS = 10;

	function niceNumber(x) {
		if (x <= 0) return 1;
		const exp = Math.floor(Math.log10(x));
		const f = x / Math.pow(10, exp);
		let nf = 1;
		if (f < 1.5) nf = 1;
		else if (f < 3) nf = 2;
		else if (f < 7) nf = 5;
		else nf = 10;
		return nf * Math.pow(10, exp);
	}
	function axisMax(maxVal) {
		return niceNumber(maxVal);
	}
	function x(i, n) {
		if (n <= 1) return P.l;
		return P.l + (i * innerW) / (n - 1);
	}
	function y(v, maxVal) {
		const t = maxVal > 0 ? Number(v || 0) / maxVal : 0;
		return P.t + (1 - t) * innerH;
	}
	function pathLine(values, maxVal) {
		const n = values.length;
		if (!n) return '';
		let d = `M ${x(0, n)} ${y(values[0], maxVal)}`;
		for (let i = 1; i < n; i++) d += ` L ${x(i, n)} ${y(values[i], maxVal)}`;
		return d;
	}
	function stats(values) {
		if (!values.length) return { max: 0, avg: 0 };
		const max = Math.max(...values);
		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		return { max, avg };
	}
	function tickEvery(n) {
		if (n <= MAX_X_TICKS) return 1;
		return Math.ceil(n / MAX_X_TICKS);
	}

	function fmtYCHF(v) {
		const n = Number(v || 0);
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
		return n.toFixed(0);
	}
	function fmtYCount(v) {
		return String(Math.round(Number(v || 0)));
	}

	// series
	$: spentValues = weekly.map((d) => Number(d.purchasedValue || 0));
	$: wasteValueValues = weekly.map((d) => Number(d.disposedValue || 0));
	$: wasteCountValues = weekly.map((d) => Number(d.disposedCount || 0));

	$: spentStat = stats(spentValues);
	$: wasteValueStat = stats(wasteValueValues);
	$: wasteCountStat = stats(wasteCountValues);

	$: spentMax = axisMax(spentStat.max);
	$: wasteValueMax = axisMax(wasteValueStat.max);
	$: wasteCountMax = axisMax(wasteCountStat.max);

	$: spentPath = pathLine(spentValues, spentMax);
	$: wasteValuePath = pathLine(wasteValueValues, wasteValueMax);
	$: wasteCountPath = pathLine(wasteCountValues, wasteCountMax);

	// hover per chart
	let hoverIdx = -1;
	function onMove(e) {
		const svg = e.currentTarget;
		const rect = svg.getBoundingClientRect();
		const px = e.clientX - rect.left;
		const n = weekly.length;
		if (n <= 0) return;
		const t = px / rect.width;
		const i = Math.round(t * (n - 1));
		hoverIdx = Math.max(0, Math.min(n - 1, i));
	}
	function onLeave() {
		hoverIdx = -1;
	}
	function tooltipAll(i) {
		const w = weekly[i];
		if (!w) return '';
		return `Woche ab ${w.week}\nAusgaben: ${chf(w.purchasedValue)}\nWeggeworfen (CHF): ${chf(w.disposedValue)}\nWeggeworfen (Anzahl): ${w.disposedCount}`;
	}
</script>

<section class="header">
	<div class="title">
		<h1>Statistiken</h1>
		<p class="subtitle">Wochenwerte · {data.from} bis {data.to}</p>
	</div>

	<form method="GET" class="range">
		<label for="range">Zeitraum</label>
		<select id="range" name="range" on:change={(e) => e.currentTarget.form?.submit()}>
			{#each ranges as r}
				<option value={r.v} selected={r.v === data.range}>{r.l}</option>
			{/each}
		</select>
	</form>
</section>

<section class="kpis">
	<SummaryCard title="Ausgaben" value={chf(data.totals?.spent)} icon="🛒" variant="money" />
	<SummaryCard title="Weggeworfen (CHF)" value={chf(data.totals?.wasteValue)} icon="💸" variant="warning" />
	<SummaryCard title="Weggeworfen (Anzahl)" value={String(data.totals?.wasteCount ?? 0)} icon="🗑️" variant="warning" />
</section>

{#if weekly.length === 0}
	<p class="empty">Keine Daten im gewählten Zeitraum.</p>
{:else}
	<section class="stack">
		<!-- Chart 1 -->
		<article class="panel">
			<header class="panel-header">
				<div>
					<h2>Ausgaben pro Woche</h2>
					<p class="hint">Summe aller Käufe pro Woche (CHF)</p>
				</div>
				<div class="meta">
					<span class="badge blue">● Ausgaben</span>
					<span>Max {chf(spentStat.max)} · Ø {chf(spentStat.avg)}</span>
				</div>
			</header>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				class="svg"
				on:mousemove={onMove}
				on:mouseleave={onLeave}
				role="img"
				aria-label="Ausgaben pro Woche"
			>
				{#each Array(GRID_Y + 1) as _, gi (gi)}
					{@const v = (spentMax * gi) / GRID_Y}
					{@const yy = y(v, spentMax)}
					<line x1={P.l} y1={yy} x2={W - P.r} y2={yy} class="grid" />
					<text x={P.l - 12} y={yy + 5} text-anchor="end" class="yTick">{fmtYCHF(v)}</text>
				{/each}

				<line x1={P.l} y1={P.t} x2={P.l} y2={H - P.b} class="axis" />
				<line x1={P.l} y1={H - P.b} x2={W - P.r} y2={H - P.b} class="axis" />

				<path d={spentPath} class="line blue" />

				{#each weekly as w, i (w.week)}
					{@const xx = x(i, weekly.length)}
					{@const yy = y(spentValues[i], spentMax)}
					<circle cx={xx} cy={yy} r="4" class="dot blue" />

					{#if i % tickEvery(weekly.length) === 0}
						<text x={xx} y={H - 16} text-anchor="middle" class="xTick">{fmtWeek(w.week)}</text>
					{/if}
				{/each}

				{#if hoverIdx >= 0}
					{@const xx = x(hoverIdx, weekly.length)}
					<line x1={xx} y1={P.t} x2={xx} y2={H - P.b} class="hoverLine" />
					<circle cx={xx} cy={y(spentValues[hoverIdx], spentMax)} r="6" class="hoverDot blue">
						<title>{tooltipAll(hoverIdx)}</title>
					</circle>
				{/if}
			</svg>
		</article>

		<!-- Chart 2 -->
		<article class="panel">
			<header class="panel-header">
				<div>
					<h2>Weggeworfener Wert</h2>
					<p class="hint">Summe aller Entsorgungen pro Woche (CHF)</p>
				</div>
				<div class="meta">
					<span class="badge red">● Weggeworfen (CHF)</span>
					<span>Max {chf(wasteValueStat.max)} · Ø {chf(wasteValueStat.avg)}</span>
				</div>
			</header>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				class="svg"
				on:mousemove={onMove}
				on:mouseleave={onLeave}
				role="img"
				aria-label="Weggeworfener Wert pro Woche"
			>
				{#each Array(GRID_Y + 1) as _, gi (gi)}
					{@const v = (wasteValueMax * gi) / GRID_Y}
					{@const yy = y(v, wasteValueMax)}
					<line x1={P.l} y1={yy} x2={W - P.r} y2={yy} class="grid" />
					<text x={P.l - 12} y={yy + 5} text-anchor="end" class="yTick">{fmtYCHF(v)}</text>
				{/each}

				<line x1={P.l} y1={P.t} x2={P.l} y2={H - P.b} class="axis" />
				<line x1={P.l} y1={H - P.b} x2={W - P.r} y2={H - P.b} class="axis" />

				<path d={wasteValuePath} class="line red" />

				{#each weekly as w, i (w.week)}
					{@const xx = x(i, weekly.length)}
					{@const yy = y(wasteValueValues[i], wasteValueMax)}
					<circle cx={xx} cy={yy} r="4" class="dot red" />

					{#if i % tickEvery(weekly.length) === 0}
						<text x={xx} y={H - 16} text-anchor="middle" class="xTick">{fmtWeek(w.week)}</text>
					{/if}
				{/each}

				{#if hoverIdx >= 0}
					{@const xx = x(hoverIdx, weekly.length)}
					<line x1={xx} y1={P.t} x2={xx} y2={H - P.b} class="hoverLine" />
					<circle cx={xx} cy={y(wasteValueValues[hoverIdx], wasteValueMax)} r="6" class="hoverDot red">
						<title>{tooltipAll(hoverIdx)}</title>
					</circle>
				{/if}
			</svg>
		</article>

		<!-- Chart 3 -->
		<article class="panel">
			<header class="panel-header">
				<div>
					<h2>Weggeworfene Anzahl</h2>
					<p class="hint">Entsorgte Produkte pro Woche (Stück / Packungen)</p>
				</div>
				<div class="meta">
					<span class="badge orange">● Weggeworfen (Anzahl)</span>
					<span>Max {wasteCountStat.max} · Ø {wasteCountStat.avg.toFixed(1)}</span>
				</div>
			</header>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				class="svg"
				on:mousemove={onMove}
				on:mouseleave={onLeave}
				role="img"
				aria-label="Weggeworfene Anzahl pro Woche"
			>
				{#each Array(GRID_Y + 1) as _, gi (gi)}
					{@const v = (wasteCountMax * gi) / GRID_Y}
					{@const yy = y(v, wasteCountMax)}
					<line x1={P.l} y1={yy} x2={W - P.r} y2={yy} class="grid" />
					<text x={P.l - 12} y={yy + 5} text-anchor="end" class="yTick">{fmtYCount(v)}</text>
				{/each}

				<line x1={P.l} y1={P.t} x2={P.l} y2={H - P.b} class="axis" />
				<line x1={P.l} y1={H - P.b} x2={W - P.r} y2={H - P.b} class="axis" />

				<path d={wasteCountPath} class="line orange" />

				{#each weekly as w, i (w.week)}
					{@const xx = x(i, weekly.length)}
					{@const yy = y(wasteCountValues[i], wasteCountMax)}
					<circle cx={xx} cy={yy} r="4" class="dot orange" />

					{#if i % tickEvery(weekly.length) === 0}
						<text x={xx} y={H - 16} text-anchor="middle" class="xTick">{fmtWeek(w.week)}</text>
					{/if}
				{/each}

				{#if hoverIdx >= 0}
					{@const xx = x(hoverIdx, weekly.length)}
					<line x1={xx} y1={P.t} x2={xx} y2={H - P.b} class="hoverLine" />
					<circle cx={xx} cy={y(wasteCountValues[hoverIdx], wasteCountMax)} r="6" class="hoverDot orange">
						<title>{tooltipAll(hoverIdx)}</title>
					</circle>
				{/if}
			</svg>
		</article>
	</section>
{/if}

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.title h1 { margin: 0 0 0.25rem 0; font-size: 1.7rem; }
	.subtitle { margin: 0; color: #6b7280; font-size: 0.92rem; }

	.range {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 999px;
		padding: 0.35rem 0.6rem;
	}
	.range label { font-size: 0.85rem; color: #4b5563; }
	.range select {
		border-radius: 999px;
		border: 1px solid #d1d5db;
		padding: 0.25rem 0.6rem;
		background: white;
	}

	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.stack {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}

	.panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		padding: 1.1rem 1.25rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}

	.panel-header h2 { margin: 0; font-size: 1.1rem; }
	.hint { margin: 0.2rem 0 0 0; color: #6b7280; font-size: 0.9rem; }

	.meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.35rem;
		color: #6b7280;
		font-size: 0.9rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		font-size: 0.9rem;
		border: 1px solid;
		background: #f9fafb;
		white-space: nowrap;
	}
	.badge.blue { color: #1d4ed8; border-color: #bfdbfe; background: #eff6ff; }
	.badge.red { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
	.badge.orange { color: #b45309; border-color: #fed7aa; background: #fff7ed; }

	.svg {
		width: 100%;
		height: auto;
		display: block;
		border-radius: 1rem;
		background: linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%);
		border: 1px solid #eef2f7;
	}

	.grid { stroke: #eef2f7; stroke-width: 1; }
	.axis { stroke: #d1d5db; stroke-width: 1.5; }

	.yTick, .xTick { fill: #6b7280; font-size: 14px; user-select: none; }

	.line { fill: none; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
	.line.blue { stroke: #3b82f6; }
	.line.red { stroke: #ef4444; }
	.line.orange { stroke: #f59e0b; }

	.dot { opacity: 0.9; }
	.dot.blue { fill: #3b82f6; }
	.dot.red { fill: #ef4444; }
	.dot.orange { fill: #f59e0b; }

	.hoverLine { stroke: #9ca3af; stroke-dasharray: 4 4; stroke-width: 1.2; }
	.hoverDot { stroke: white; stroke-width: 2; }
	.hoverDot.blue { fill: #2563eb; }
	.hoverDot.red { fill: #dc2626; }
	.hoverDot.orange { fill: #d97706; }

	.empty { color: #6b7280; }
</style>
