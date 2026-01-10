<script>
	export let id;

	export let name = 'Produktname';
	export let icon = '🥕';

	// totalQuantity kommt vom Server: Summe Stück (berechnet)
	export let totalQuantity = 0;

	// Preis pro Stück/Packung
	export let pricePerUnit = 0;
	export let currency = 'CHF';

	export let variants = [];
	export let storageLocation = 'Kühlschrank';

	// Pack-Infos: null, wenn echtes Stück-Produkt
	export let packUnit = null; // 'g' | 'ml' | null
	export let packSize = null; // number | null

	// ✅ user setting vom Inventar
	export let soonThresholdDays = 3;

	$: isPackProduct = Boolean(packUnit && packSize && packSize > 0);
	$: totalPrice = (pricePerUnit || 0) * (totalQuantity || 0);

	function formatDate(dateStr) {
		if (!dateStr) return '-';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const [year, month, day] = parts;
		return `${day}.${month}.${year}`;
	}

	function piecesFromRemaining(remainingAmount) {
		if (!isPackProduct) return 0;
		const amt = Number(remainingAmount || 0);
		if (amt <= 0) return 0;
		return Math.ceil(amt / packSize);
	}

	// ✅ Farblogik clientseitig
	function getVariantStatus(expirationDate) {
		if (!expirationDate) return 'ok';

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const exp = new Date(expirationDate);
		exp.setHours(0, 0, 0, 0);

		const diffDays = (exp - today) / (1000 * 60 * 60 * 24);

		if (diffDays < 0) return 'expired';
		if (diffDays <= soonThresholdDays) return 'soon';
		return 'ok';
	}
</script>

<article class="card">
	<header class="card-header">
		<div class="left">
			<div class="icon">{icon}</div>
			<div>
				<h2>{name}</h2>
				<p class="total">
					{#if isPackProduct}
						{totalQuantity} Stück × {packSize}{packUnit}
					{:else}
						{totalQuantity} Stück
					{/if}
				</p>
			</div>
		</div>
	</header>

	<section class="variants">
		{#each variants as variant, index (variant.expirationDate + '-' + index)}
			<div class="variant-row" data-status={getVariantStatus(variant.expirationDate)}>
				<div class="meta">
					<p class="label">Ablauf: {formatDate(variant.expirationDate)}</p>

					{#if isPackProduct}
						<p class="sub">Bestand: {variant.remainingAmount}{packUnit}</p>
					{:else}
						<p class="sub">Bestand: {variant.piecesRemaining} Stück</p>
					{/if}
				</div>

				<div class="controls">
					<div class="step">
						<button
							type="submit"
							name="intent"
							value={`dec:${index}`}
							title="1 Stück weniger (aufgebraucht)"
							aria-label="1 Stück weniger (aufgebraucht)"
						>
							-
						</button>

						<span class="qty" title="Aktueller Bestand (als Stück)">
							{#if isPackProduct}
								{piecesFromRemaining(variant.remainingAmount)}
							{:else}
								{variant.piecesRemaining}
							{/if}
						</span>

						<button
							type="submit"
							name="intent"
							value={`inc:${index}`}
							title="1 Stück hinzugefügt (z.B. neu gekauft)"
							aria-label="1 Stück hinzugefügt"
						>
							+
						</button>
					</div>

					<button
						type="submit"
						name="intent"
						value={`dispose:${index}`}
						class="warn"
						title="Entsorgen (landet im Müll & zählt zur Statistik)"
						aria-label="Entsorgen"
					>
						🗑️
					</button>
				</div>

				{#if isPackProduct}
					<div class="custom">
						<span class="custom-label">Menge verbrauchen</span>

						<input
							type="number"
							name={`customAmount:${index}`}
							min="0"
							step="1"
							placeholder={`z.B. 500 ${packUnit}`}
							title={`Trage ein, wie viel du verbraucht hast (in ${packUnit}).`}
							aria-label={`Menge verbrauchen in ${packUnit}`}
						/>

						<button
							type="submit"
							name="intent"
							value={`decCustom:${index}`}
							class="small"
							title="Diese Menge vom Bestand abziehen"
							aria-label="Menge vom Bestand abziehen"
						>
							OK
						</button>
					</div>
				{/if}
			</div>
		{/each}
	</section>

	<footer class="card-footer">
		<div class="info">
			<p class="storage">📍 {storageLocation}</p>
			<p class="unit-price">💸 {Number(pricePerUnit || 0).toFixed(2)} {currency} / Stück</p>
<p class="total-price">🧾 Gesamt: {Number(totalPrice || 0).toFixed(2)} {currency}</p>

		</div>

		<div class="actions stacked">
			<button
				type="submit"
				name="intent"
				value="delete"
				class="secondary"
				title="Markiert alles als aufgebraucht (wird als Verbrauch gezählt)"
			>
				Alle aufgebraucht
			</button>

			<a class="primary link-button" href={`/inventar/${id}/bearbeiten`} title="Produktdetails bearbeiten">
				Bearbeiten
			</a>

			<button
				type="submit"
				name="intent"
				value="disposeAll"
				class="danger"
				title="Markiert alles als entsorgt (landet in der Waste-Statistik)"
			>
				Alle entsorgt 🗑️
			</button>
		</div>
	</footer>
</article>

<style>
	/* ===== Card Layout ===== */
	.card {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.icon {
		width: 44px;
		height: 44px;
		border-radius: 0.9rem;
		background: #f4f4f5;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.8rem;
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.total {
		margin: 0;
		color: #6b7280;
		font-size: 0.9rem;
	}

	/* ===== Variants ===== */
	.variants {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.variant-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.5rem;
		align-items: center;
		padding: 0.6rem 0.8rem;
		border-radius: 0.8rem;
		background: #f9fafb;
		font-size: 0.9rem;
		border: 1px solid transparent;
	}

	/* 🟠 bald ablaufend */
	.variant-row[data-status='soon'] {
		border-color: #fb923c;
		background: #fff7ed;
	}

	/* 🔴 abgelaufen */
	.variant-row[data-status='expired'] {
		border-color: #ef4444;
		background: #fef2f2;
	}

	.meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 0.75rem;
	}

	.label {
		margin: 0;
	}

	.sub {
		margin: 0;
		color: #6b7280;
		font-size: 0.85rem;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.step button {
		width: 1.9rem;
		height: 1.9rem;
		border-radius: 999px;
		border: none;
		background: #e5e7eb;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
	}

	.qty {
		min-width: 2.5rem;
		text-align: center;
		font-weight: 650;
		color: #111827;
	}

	.warn {
		border: none;
		background: #fee2e2;
		color: #b91c1c;
		border-radius: 999px;
		width: 2rem;
		height: 2rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	/* ===== Custom ===== */
	.custom {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: 0.5rem;
	}

	.custom-label {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.custom input {
		width: 7rem;
		border-radius: 999px;
		border: 1px solid #d1d5db;
		padding: 0.35rem 0.55rem;
		font-size: 0.85rem;
		background: white;
	}

	.custom .small {
		border: none;
		background: #e5e7eb;
		border-radius: 999px;
		padding: 0.35rem 0.65rem;
		cursor: pointer;
		font-size: 0.85rem;
	}

	/* ===== Footer as Grid ===== */
	.card-footer {
		display: grid;
		grid-template-columns: 1fr 170px;
		gap: 1rem;
		align-items: start;

		border-top: 1px solid #e5e7eb;
		padding-top: 0.85rem;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		color: #4b5563;
	}

	.storage,
	.unit-price,
	.total-price {
		margin: 0;
		line-height: 1.25;
	}

	.unit-price {
		font-size: 0.85rem;
		color: #6b7280;
	}

	.total-price {
		font-weight: 700;
		font-size: 0.95rem;
		color: #111827;
	}

	.actions.stacked {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: stretch;
		justify-content: flex-start;
	}

	.actions.stacked button,
	.actions.stacked .link-button {
		width: 100%;
		text-align: center;
		border-radius: 999px;
		padding: 0.4rem 1rem;
		border: none;
		font-size: 0.85rem;
		cursor: pointer;
		text-decoration: none;
	}

	.secondary {
		background: #e5e7eb;
		color: #111827;
	}

	.primary {
		background: #0f766e;
		color: white;
	}

	.danger {
		background: #fee2e2;
		color: #b91c1c;
	}

	.link-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	@media (max-width: 768px) {
		.card-footer {
			grid-template-columns: 1fr;
		}

		.custom {
			grid-template-columns: 1fr 1fr auto;
		}
	}
</style>
