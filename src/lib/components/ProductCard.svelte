<script>
	// ID für Bearbeiten-Link (wird von außen übergeben)
	export let id;

	export let name = 'Produktname';
	export let icon = '🥕';
	export let totalQuantity = 0;
	export let unit = 'Stück';
	export let amountPerUnit = null;
	export let variants = [];
	export let storageLocation = 'Kühlschrank';
	export let pricePerUnit = 0;
	export let currency = 'CHF';

	$: totalPrice = pricePerUnit * totalQuantity;

	// Datum von YYYY-MM-DD → DD.MM.YYYY
	function formatDate(dateStr) {
		if (!dateStr) return '-';
		const parts = dateStr.split('-');
		if (parts.length !== 3) return dateStr;
		const [year, month, day] = parts;
		return `${day}.${month}.${year}`;
	}
</script>

<article class="card">
	<header class="card-header">
		<div class="left">
			<div class="icon">{icon}</div>
			<div>
				<h2>{name}</h2>
				<p class="total">
					{#if amountPerUnit}
						{totalQuantity} × {amountPerUnit} {unit}
					{:else}
						{totalQuantity} {unit}
					{/if}
				</p>
			</div>
		</div>
	</header>

	<section class="variants">
		{#each variants as variant, index (variant.expirationDate + '-' + index)}
			<div class="variant-row" data-status={variant.status}>
				<div class="variant-info">
					<p class="label">Ablauf: {formatDate(variant.expirationDate)}</p>
				</div>

				<div class="variant-quantity">
					<button
						type="submit"
						name="intent"
						value={`dec:${index}`}
						title="1 Stück verbraucht"
					>
						-
					</button>

					<span>
						{#if amountPerUnit}
							{variant.quantity} × {amountPerUnit} {unit}
						{:else}
							{variant.quantity} {unit}
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

				<div class="variant-actions">
					<button
						type="submit"
						name="intent"
						value={`dispose:${index}`}
						class="warn"
						title="Diese Variante entsorgen"
					>
						⚠
					</button>
				</div>
			</div>
		{/each}
	</section>

	<footer class="card-footer">
		<div class="info">
			<p class="storage">📍 {storageLocation}</p>
			<p class="price">
				{pricePerUnit.toFixed(2)} {currency} / {unit}<br />
				<span class="total-price">Gesamt: {totalPrice.toFixed(2)} {currency}</span>
			</p>
		</div>
		<div class="actions">
			<button type="submit" name="intent" value="delete" class="secondary">
				Löschen
			</button>
			<a class="primary link-button" href={`/inventar/${id}/bearbeiten`}>
				Bearbeiten
			</a>
			<button type="submit" name="intent" value="disposeAll" class="danger">
				Alles entsorgen
			</button>
		</div>
	</footer>
</article>

<style>
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

	.variants {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.variant-row {
		display: grid;
		grid-template-columns: 1.7fr 1.5fr auto;
		align-items: center;
		padding: 0.6rem 0.8rem;
		border-radius: 0.8rem;
		background: #f9fafb;
		font-size: 0.9rem;
		column-gap: 0.75rem;
	}

	.variant-row[data-status='soon'] {
		border: 1px solid #f97316;
	}

	.variant-row[data-status='expired'] {
		border: 1px solid #ef4444;
		background: #fef2f2;
	}

	.label {
		margin: 0;
	}

	.variant-quantity {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.variant-quantity button {
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

	.variant-quantity span {
		min-width: 6.2rem;
		text-align: center;
	}

	.variant-actions {
		display: flex;
		justify-content: flex-end;
	}

	.variant-actions .warn {
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
	}
</style>
