<script>
	import { getFoodEmoji } from '$lib/emoji-food-map.js';

	export let data;
	const { product } = data;

	let name = product.name;
	let icon = product.icon;
	let unit = product.unit;
	let storageLocation = product.storageLocation;
	let pricePerUnit = product.pricePerUnit;
	let amountPerUnit = product.amountPerUnit;

	let variants =
		product.variants && product.variants.length
			? product.variants
			: [{ id: 1, quantity: 1, expirationDate: '' }];

	let nextId = variants.length + 1;

	// Einheit-Logik: Stück => immer 1
$: if (unit === 'Stück') {
	amountPerUnit = 1;
}


	function addVariantRow() {
		variants = [
			...variants,
			{ id: nextId++, quantity: 1, expirationDate: '' }
		];
	}

	function removeVariantRow(id) {
		if (variants.length === 1) return;
		variants = variants.filter((v) => v.id !== id);
	}

	function updateVariant(id, field, value) {
		variants = variants.map((v) =>
			v.id === id ? { ...v, [field]: value } : v
		);
	}

	// Emoji automatisch vorschlagen / aktualisieren
	$: icon = getFoodEmoji(name, icon || '🍽️');
</script>

<section class="page-header">
	<div>
		<h1>Produkt bearbeiten</h1>
		<p class="subtitle">Passe die Informationen zu diesem Produkt an.</p>
	</div>
	<a href="/inventar" class="secondary-button">Zurück zum Inventar</a>
</section>

<form class="form" method="POST">
	<section class="card">
		<h2>Basisinformationen</h2>
		<div class="grid">
			<div class="field">
				<label for="name">Produktname</label>
				<input
					id="name"
					name="name"
					type="text"
					bind:value={name}
					required
				/>
			</div>

			<div class="field">
				<label for="icon">Icon (Emoji)</label>
				<input
					id="icon"
					name="icon"
					type="text"
					maxlength="2"
					bind:value={icon}
				/>
			</div>

			<div class="field">
				<label for="unit">Einheit</label>
				<select id="unit" name="unit" bind:value={unit}>
					<option value="Stück">Stück</option>
					<option value="g">g</option>
					<option value="kg">kg</option>
					<option value="ml">ml</option>
					<option value="l">l</option>
				</select>
			</div>

			<div class="field">
				<label for="amount">Menge pro Einheit</label>
				<div class="with-unit">
					<input
						id="amount"
						name="amountPerUnit"
						type="number"
						min="0"
						step="0.01"
						bind:value={amountPerUnit}
						required
					/>
					<span class="unit-label">{unit}</span>
				</div>
				<p class="field-hint">z.B. 250 ml, 500 g, 1 Stück</p>
			</div>

			<div class="field">
				<label for="storage">Aufbewahrungsort</label>
				<select
					id="storage"
					name="storageLocation"
					bind:value={storageLocation}
				>
					<option value="Kühlschrank">Kühlschrank</option>
					<option value="Vorratsschrank">Vorratsschrank</option>
					<option value="Tiefkühler">Tiefkühler</option>
				</select>
			</div>

			<div class="field">
				<label for="price">Preis pro Einheit (CHF)</label>
				<input
					id="price"
					name="pricePerUnit"
					type="number"
					step="0.05"
					min="0"
					bind:value={pricePerUnit}
					placeholder="z.B. 0.80"
				/>
			</div>
		</div>
	</section>

	<!-- VARIANTEN-BEREICH -->
	<section class="card">
		<div class="card-header">
			<h2>Mengen & Ablaufdaten</h2>
			<button type="button" class="small-button" on:click={addVariantRow}>
				+ Zeile hinzufügen
			</button>
		</div>

		<p class="hint">
			Falls du dasselbe Produkt mit verschiedenen Ablaufdaten hast,
			kannst du mehrere Zeilen anlegen.
		</p>

		<div class="variant-header-row">
			<span>Menge</span>
			<span>Ablaufdatum</span>
			<span></span>
		</div>

		{#each variants as variant (variant.id)}
			<div class="variant-row">
				<div>
					<input
						type="number"
						min="1"
						step="1"
						name="variant_quantity"
						bind:value={variant.quantity}
						on:input={(e) =>
							updateVariant(
								variant.id,
								'quantity',
								Number(e.target.value) || 0
							)}
					/>
				</div>

				<div>
					<input
						type="date"
						name="variant_expirationDate"
						bind:value={variant.expirationDate}
						on:input={(e) =>
							updateVariant(
								variant.id,
								'expirationDate',
								e.target.value
							)}
						required
					/>
				</div>

				<div class="variant-actions">
					<button
						type="button"
						class="icon-button"
						on:click={() => removeVariantRow(variant.id)}
						title="Zeile entfernen"
					>
						✕
					</button>
				</div>
			</div>
		{/each}
	</section>

	<section class="form-actions">
		<a href="/inventar" class="secondary-button">Abbrechen</a>
		<button type="submit" class="primary-button">
			Änderungen speichern
		</button>
	</section>
</form>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
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

	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 900px;
	}

	.card {
		background: white;
		border-radius: 1rem;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
		border: 1px solid #e5e7eb;
	}

	.card h2 {
		margin-top: 0;
		margin-bottom: 1rem;
		font-size: 1.1rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem 1.25rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	label {
		font-size: 0.85rem;
		color: #4b5563;
	}

	input,
	select {
		border-radius: 0.6rem;
		border: 1px solid #d1d5db;
		padding: 0.45rem 0.6rem;
		font-size: 0.9rem;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #0f766e;
		box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.2);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.hint {
		margin: 0 0 0.75rem 0;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.variant-header-row {
		display: grid;
		grid-template-columns: 1fr 2fr auto;
		font-size: 0.8rem;
		color: #6b7280;
		margin-bottom: 0.25rem;
	}

	.variant-row {
		display: grid;
		grid-template-columns: 1fr 2fr auto;
		gap: 0.5rem;
		align-items: center;
		margin-bottom: 0.4rem;
	}

	.variant-actions {
		display: flex;
		justify-content: flex-end;
	}

	.icon-button {
		border: none;
		background: #fee2e2;
		color: #b91c1c;
		border-radius: 999px;
		width: 1.8rem;
		height: 1.8rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.with-unit {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.unit-label {
		font-size: 0.85rem;
		color: #4b5563;
		padding: 0.3rem 0.6rem;
		border-radius: 0.6rem;
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
	}

	.field-hint {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.primary-button,
	.secondary-button,
	.small-button {
		border-radius: 999px;
		border: none;
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
	}

	.primary-button {
		background: #0f766e;
		color: white;
	}

	.secondary-button {
		background: #e5e7eb;
		color: #111827;
	}

	.small-button {
		background: #e5e7eb;
		color: #111827;
		font-size: 0.8rem;
		padding: 0.35rem 0.8rem;
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
			align-items: flex-start;
		}

		.form-actions {
			flex-direction: column-reverse;
			align-items: stretch;
		}

		.primary-button,
		.secondary-button {
			width: 100%;
		}
	}
</style>
