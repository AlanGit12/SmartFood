<script>
	import { getFoodEmoji } from '$lib/emoji-food-map.js';
	import '$lib/styles/forms.css';

	export let data;
	const { product, locations = [] } = data;

	let name = product.name;
	let icon = product.icon ?? '🥕';
	let unit = product.unit ?? 'Stück';
	let amountPerUnit = product.amountPerUnit ?? 1;

	// Falls du locations schon im load mitgibst: Dropdown, sonst Textfeld fallback
	let storageLocation = product.storageLocation ?? (locations[0]?.name ?? 'Kühlschrank');

	let pricePerUnit = product.pricePerUnit ?? 0;

	let variants =
		product.variants && product.variants.length
			? product.variants
			: [{ id: 1, quantity: 1, expirationDate: '' }];

	let nextId = variants.length + 1;

	let iconTouched = false;

	// Stück => Menge immer 1
	$: if (unit === 'Stück') {
		amountPerUnit = 1;
	}

	// Auto-Emoji nur wenn User nicht manuell editiert
	$: if (!iconTouched) {
		icon = getFoodEmoji(name, icon || '🍽️');
	}

	function onIconInput(e) {
		iconTouched = true;
		icon = e.currentTarget.value;
	}

	function addVariant() {
		variants = [...variants, { id: nextId++, quantity: 1, expirationDate: '' }];
	}

	function removeVariant(id) {
		if (variants.length === 1) return;
		variants = variants.filter((v) => v.id !== id);
	}
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
				<input id="name" name="name" type="text" bind:value={name} required />
			</div>

			<div class="field">
				<label for="icon">Icon (Emoji)</label>
				<input id="icon" name="icon" type="text" maxlength="2" value={icon} on:input={onIconInput} />
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
				<p class="field-hint">z.B. 250 ml, 500 g, 1 Stück</p>
			</div>

			<div class="field">
				<label for="storageLocation">Aufbewahrungsort</label>

				{#if locations.length > 0}
					<select id="storageLocation" name="storageLocation" bind:value={storageLocation}>
						{#each locations as loc (loc.id)}
							<option value={loc.name}>{loc.name}</option>
						{/each}
					</select>
				{:else}
					<input
						id="storageLocation"
						name="storageLocation"
						type="text"
						bind:value={storageLocation}
						required
					/>
				{/if}
			</div>

			<div class="field">
				<label for="pricePerUnit">Preis pro Einheit (CHF)</label>
				<input
					id="pricePerUnit"
					name="pricePerUnit"
					type="number"
					step="0.05"
					min="0"
					bind:value={pricePerUnit}
				/>
			</div>
		</div>
	</section>

	<section class="card">
		<div class="card-header">
			<h2>Mengen & Ablaufdaten</h2>
			<button type="button" class="small-button" on:click={addVariant}>
				+ Zeile hinzufügen
			</button>
		</div>

		{#each variants as v (v.id)}
			<div class="variant-row">
				<label class="sr-only" for={`variant-qty-${v.id}`}>Menge</label>
				<input
					id={`variant-qty-${v.id}`}
					type="number"
					min="1"
					step="1"
					name="variant_quantity"
					bind:value={v.quantity}
				/>

				<label class="sr-only" for={`variant-exp-${v.id}`}>Ablaufdatum</label>
				<input
					id={`variant-exp-${v.id}`}
					type="date"
					name="variant_expirationDate"
					bind:value={v.expirationDate}
					required
				/>

				<button
					type="button"
					class="icon-button"
					on:click={() => removeVariant(v.id)}
					title="Zeile entfernen"
					aria-label="Zeile entfernen"
				>
					✕
				</button>
			</div>
		{/each}
	</section>

	<section class="form-actions">
		<a href="/inventar" class="secondary-button">Abbrechen</a>
		<button type="submit" class="primary-button">Änderungen speichern</button>
	</section>
</form>

<style>
	/* nur für screenreader-labels in den Varianten */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
