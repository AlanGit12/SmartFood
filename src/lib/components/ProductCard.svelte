<script>
	/**
	 * ProductCard.svelte
	 * =========================================================
	 * Zielmodell:
	 * - Ohne Stückgröße (z.B. Apfel): piecesRemaining (Stück)
	 * - Mit Stückgröße (z.B. Joghurt 250ml, Nudeln 1kg):
	 *   remainingAmount (g/ml) und Stück-Anzeige = ceil(remainingAmount / packSize)
	 * =========================================================
	 */

	export let id;

	export let name = "Produktname";
	export let icon = "🥕";

	// totalQuantity kommt vom Server: Summe der Stück/Packungen (berechnet)
	export let totalQuantity = 0;

	// Preis pro Stück/Packung
	export let pricePerUnit = 0;
	export let currency = "CHF";

	export let variants = [];
	export let storageLocation = "Kühlschrank";

	// Pack-Infos: null, wenn echtes Stück-Produkt
	export let packUnit = null; // 'g' | 'ml' | null
	export let packSize = null; // number | null

	$: isPackProduct = Boolean(packUnit && packSize && packSize > 0);

	$: totalPrice = (pricePerUnit || 0) * (totalQuantity || 0);

	function formatDate(dateStr) {
		if (!dateStr) return "-";
		const parts = dateStr.split("-");
		if (parts.length !== 3) return dateStr;
		const [year, month, day] = parts;
		return `${day}.${month}.${year}`;
	}

	function piecesFromRemaining(remainingAmount) {
		// Y Stück = ceil(remainingAmount / packSize)
		if (!isPackProduct) return 0;
		const amt = Number(remainingAmount || 0);
		if (amt <= 0) return 0;
		return Math.ceil(amt / packSize);
	}
</script>

<article class="card">
	<header class="card-header">
		<div class="left">
			<div class="icon">{icon}</div>
			<div>
				<h2>{name}</h2>

				<!-- Header-Bestand -->
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

	<!-- Varianten -->
	<section class="variants">
		{#each variants as variant, index (variant.expirationDate + "-" + index)}
			<div class="variant-row" data-status={variant.status}>
				<!-- Meta: Ablauf + Bestandstext -->
				<div class="meta">
					<p class="label">
						Ablauf: {formatDate(variant.expirationDate)}
					</p>

					{#if isPackProduct}
						<p class="sub">
							Bestand: {variant.remainingAmount}{packUnit}
						</p>
					{:else}
						<p class="sub">
							Bestand: {variant.piecesRemaining} Stück
						</p>
					{/if}
				</div>

				<!-- Controls: - Zahl + und Mülleimer -->
				<div class="controls">
					<div class="step">
						<button
							type="submit"
							name="intent"
							value={`dec:${index}`}
							title="1 Stück entfernen"
						>
							-
						</button>

						<span class="qty">
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
							title="1 Stück hinzufügen"
						>
							+
						</button>
					</div>

					<button
						type="submit"
						name="intent"
						value={`dispose:${index}`}
						class="warn"
						title="Variante entsorgen"
					>
						🗑️
					</button>
				</div>

				<!-- Custom-Feld: nur bei Pack-Produkten -->
				{#if isPackProduct}
					<div class="custom">
						<input
							type="number"
							name={`customAmount:${index}`}
							min="0"
							step="1"
							placeholder={`z.B. 500 ${packUnit}`}
							title="Menge manuell abziehen"
						/>
						<button
							type="submit"
							name="intent"
							value={`decCustom:${index}`}
							class="small"
							title="Manuelle Menge abziehen"
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
			<p class="price">
				{pricePerUnit.toFixed(2)}
				{currency} / Stück<br />
				<span class="total-price"
					>Gesamt: {totalPrice.toFixed(2)} {currency}</span
				>
			</p>
		</div>

		<div class="actions">
			<button
				type="submit"
				name="intent"
				value="delete"
				class="secondary"
			>
				Löschen
			</button>

			<a class="primary link-button" href={`/inventar/${id}/bearbeiten`}>
				Bearbeiten
			</a>

			<button
				type="submit"
				name="intent"
				value="disposeAll"
				class="danger"
			>
				Alles entsorgen
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
	}

	.variant-row[data-status="soon"] {
		border: 1px solid #f97316;
	}

	.variant-row[data-status="expired"] {
		border: 1px solid #ef4444;
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
	font-weight: 600;
	font-size: 0.95rem;
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

	.custom {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 0.35rem;
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

	/* ===== Footer ===== */
	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		font-size: 0.9rem;
	}

	.info {
		color: #4b5563;
	}

	.storage {
		margin: 0 0 0.25rem 0;
	}

	.price {
		margin: 0;
	}

	.total-price {
		font-weight: 600;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.actions button,
	.link-button {
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
			flex-direction: column;
			align-items: stretch;
		}

		.actions {
			justify-content: stretch;
		}

		.actions button,
		.link-button {
			flex: 1;
			text-align: center;
		}

		.custom {
			flex-wrap: wrap;
		}
	}
</style>
