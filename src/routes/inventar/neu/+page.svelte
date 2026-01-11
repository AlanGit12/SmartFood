<script>
	export let data;

	// ----------------------------
	// Templates
	// ----------------------------
	let templates = data.templates ?? [];
	let selectedTemplateId = '';

	// ----------------------------
	// Formular-State
	// ----------------------------
	let name = '';
	let icon = '🥕';
	let unit = 'Stück';
	let amountPerUnit = 1;
	let storageLocation = 'Kühlschrank';
	let pricePerUnit = 0;

	// Varianten (mind. eine)
	let variants = [{ id: 1, quantity: 1, expirationDate: '' }];
	let nextVariantId = 2;

	// ----------------------------
	// Reaktiv: Stück => immer 1
	// ----------------------------
	$: if (unit === 'Stück') {
		amountPerUnit = 1;
	}

	// ----------------------------
	// Template anwenden
	// ----------------------------
	function applyTemplateById(id) {
		selectedTemplateId = id;
		if (!id) return;

		const tpl = templates.find((t) => String(t.id) === String(id));
		if (!tpl) {
			console.warn('Template nicht gefunden:', id);
			return;
		}

		// ✅ Alles übernehmen
		name = tpl.name ?? name;
		icon = tpl.icon ?? icon;

		unit = tpl.displayUnit ?? unit;

		if (unit === 'Stück') {
			amountPerUnit = 1;
		} else {
			const v = Number(tpl.amountPerUnitDisplay ?? 0);
			if (Number.isFinite(v) && v > 0) amountPerUnit = v;
		}

		storageLocation = tpl.defaultStorageLocation ?? storageLocation;

		const p = Number(tpl.defaultPricePerUnit ?? 0);
		if (Number.isFinite(p)) pricePerUnit = p;
	}

	// ----------------------------
	// Varianten-Handling
	// ----------------------------
	function addVariant() {
		variants = [
			...variants,
			{ id: nextVariantId++, quantity: 1, expirationDate: '' }
		];
	}

	function removeVariant(id) {
		if (variants.length === 1) return;
		variants = variants.filter((v) => v.id !== id);
	}
</script>

<section class="page-header">
	<div>
		<h1>Produkt hinzufügen</h1>
		<p class="subtitle">Erstelle ein neues Produkt oder nutze eine Vorlage.</p>
	</div>
	<a href="/inventar" class="secondary-button">Zurück</a>
</section>

<form method="POST" class="form">
	<!-- ========================= -->
	<!-- VORLAGE -->
	<!-- ========================= -->
	<section class="card">
		<h2>Vorlage (optional)</h2>

		<div class="field">
			<label for="template">Vorlage wählen</label>
			<select
				id="template"
				bind:value={selectedTemplateId}
				on:change={(e) => applyTemplateById(e.currentTarget.value)}
			>
				<option value="">– Keine Vorlage –</option>
				{#each templates as tpl (tpl.id)}
					<option value={tpl.id}>
						{tpl.icon} {tpl.name}
					</option>
				{/each}
			</select>
		</div>
	</section>

	<!-- ========================= -->
	<!-- BASIS -->
	<!-- ========================= -->
	<section class="card">
		<h2>Basisinformationen</h2>

		<div class="grid">
			<div class="field">
				<label for="name">Produktname</label>
				<input id="name" name="name" bind:value={name} required />
			</div>

			<div class="field">
				<label for="icon">Icon</label>
				<input id="icon" name="icon" bind:value={icon} maxlength="2" />
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
				<label for="amountPerUnit">Menge pro Einheit</label>
				<input
					id="amountPerUnit"
					name="amountPerUnit"
					type="number"
					min="0.01"
					step="0.01"
					bind:value={amountPerUnit}
					required
				/>
			</div>

			<div class="field">
				<label for="storageLocation">Aufbewahrungsort</label>
				<select
					id="storageLocation"
					name="storageLocation"
					bind:value={storageLocation}
				>
					<option value="Kühlschrank">Kühlschrank</option>
					<option value="Vorratsschrank">Vorratsschrank</option>
					<option value="Tiefkühler">Tiefkühler</option>
				</select>
			</div>

			<div class="field">
				<label for="pricePerUnit">Preis pro Einheit (CHF)</label>
				<input
					id="pricePerUnit"
					name="pricePerUnit"
					type="number"
					min="0"
					step="0.05"
					bind:value={pricePerUnit}
				/>
			</div>
		</div>
	</section>

	<!-- ========================= -->
	<!-- VARIANTEN -->
	<!-- ========================= -->
	<section class="card">
		<div class="card-header">
			<h2>Mengen & Ablaufdaten</h2>
			<button type="button" class="small-button" on:click={addVariant}>
				+ Zeile hinzufügen
			</button>
		</div>

		{#each variants as v (v.id)}
			<div class="variant-row">
				<input
					type="number"
					min="1"
					step="1"
					name="variant_quantity"
					bind:value={v.quantity}
				/>

				<input
					type="date"
					name="variant_expirationDate"
					bind:value={v.expirationDate}
					required
				/>

				<button
					type="button"
					class="icon-button"
					on:click={() => removeVariant(v.id)}
					title="Entfernen"
				>
					✕
				</button>
			</div>
		{/each}
	</section>

	<!-- ========================= -->
	<!-- ACTIONS -->
	<!-- ========================= -->
	<section class="form-actions">
		<a href="/inventar" class="secondary-button">Abbrechen</a>
		<button type="submit" class="primary-button">
			Produkt speichern
		</button>
	</section>
</form>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.subtitle {
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
		border: 1px solid #e5e7eb;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
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

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.variant-row {
		display: grid;
		grid-template-columns: 1fr 2fr auto;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.icon-button {
		border: none;
		background: #fee2e2;
		color: #b91c1c;
		border-radius: 999px;
		width: 1.8rem;
		height: 1.8rem;
		cursor: pointer;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.primary-button {
		background: #0f766e;
		color: white;
		border-radius: 999px;
		padding: 0.5rem 1.2rem;
		border: none;
	}

	.secondary-button,
	.small-button {
		background: #e5e7eb;
		color: #111827;
		border-radius: 999px;
		padding: 0.5rem 1rem;
		text-decoration: none;
		border: none;
	}
</style>
