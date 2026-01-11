<script>
	import { getFoodEmoji } from '$lib/emoji-food-map.js';
	import '$lib/styles/forms.css';

	export let data;

	// Templates + Lagerorte aus server load
	let templates = data.templates ?? [];
	let locations = data.locations ?? [];

	let selectedTemplateId = '';
	let createTemplate = true;

	// Formular-State
	let name = '';
	let icon = '🥕';
	let unit = 'Stück';
	let amountPerUnit = 1;
	let storageLocation = locations[0]?.name ?? 'Kühlschrank';
	let pricePerUnit = 0;

	let iconTouched = false;

	// Varianten
	let variants = [{ id: 1, quantity: 1, expirationDate: '' }];
	let nextVariantId = 2;

	// Stück => Menge immer 1
	$: if (unit === 'Stück') amountPerUnit = 1;

	// Auto-Emoji nur wenn User nicht manuell editiert hat
	$: if (!iconTouched) {
		icon = getFoodEmoji(name, icon || '🍽️');
	}

	function onIconInput(e) {
		iconTouched = true;
		icon = e.currentTarget.value;
	}

	function applyTemplateById(id) {
		selectedTemplateId = id;
		if (!id) return;

		const tpl = templates.find((t) => String(t.id) === String(id));
		if (!tpl) return;

		name = tpl.name ?? name;

		// Template-Icon setzen => gilt als manuell gewählt
		icon = tpl.icon ?? icon;
		iconTouched = true;

		unit = tpl.displayUnit ?? unit;

		if (unit === 'Stück') amountPerUnit = 1;
		else {
			const v = Number(tpl.amountPerUnitDisplay ?? 0);
			if (Number.isFinite(v) && v > 0) amountPerUnit = v;
		}

		storageLocation = tpl.defaultStorageLocation ?? storageLocation;

		const p = Number(tpl.defaultPricePerUnit ?? 0);
		if (Number.isFinite(p)) pricePerUnit = p;
	}

	function addVariant() {
		variants = [...variants, { id: nextVariantId++, quantity: 1, expirationDate: '' }];
	}

	function removeVariant(id) {
		if (variants.length === 1) return;
		variants = variants.filter((v) => v.id !== id);
	}
</script>

<section class="page-header">
	<div>
		<h1>Produkt hinzufügen</h1>
		<p class="subtitle">Neues Produkt anlegen</p>
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
				name="templateId"
				value={selectedTemplateId}
				on:change={(e) => applyTemplateById(e.currentTarget.value)}
			>
				<option value="">– Keine Vorlage –</option>
				{#each templates as tpl (tpl.id)}
					<option value={tpl.id}>{tpl.icon} {tpl.name}</option>
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
				<input
					id="icon"
					name="icon"
					value={icon}
					on:input={onIconInput}
					maxlength="2"
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
				<select id="storageLocation" name="storageLocation" bind:value={storageLocation}>
					{#each locations as loc (loc.id)}
						<option value={loc.name}>{loc.name}</option>
					{/each}
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
					title="Entfernen"
					aria-label="Zeile entfernen"
				>
					✕
				</button>
			</div>
		{/each}

		<!-- Template Toggle -->
		<label class="toggle" for="createTemplate">
			<input
				id="createTemplate"
				type="checkbox"
				name="createTemplate"
				value="1"
				bind:checked={createTemplate}
			/>
			<span>Als Vorlage speichern</span>
		</label>

		<p class="field-hint">
			Wenn deaktiviert, wird beim Speichern keine neue Vorlage erstellt/aktualisiert.
		</p>
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
	/* Screenreader labels für Variant Inputs (a11y clean) */
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
