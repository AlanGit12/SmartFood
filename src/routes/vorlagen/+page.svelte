<script>
    export let data;
    $: locations = data.locations ?? [];

    let newUnit = "Stück";
    let newAmount = 1;

    $: if (newUnit === "Stück") newAmount = 1;

    let q = "";

    $: templates = data.templates ?? [];
    $: filtered = !q
        ? templates
        : templates.filter((t) =>
              (t.name || "").toLowerCase().includes(q.toLowerCase()),
          );
</script>

<section class="page-header">
    <div>
        <h1>Meine Produktvorlagen 📝</h1>
        <p class="subtitle">
            Vorlagen bearbeiten, löschen oder neue hinzufügen.
        </p>
    </div>
</section>

<section class="card">
    <h2>Neue Vorlage</h2>

    <form method="POST" action="?/create" class="grid">
        <div class="field">
            <label for="new_name">Name</label>
            <input id="new_name" name="name" required />
        </div>

        <div class="field">
            <label for="new_icon">Icon</label>
            <input id="new_icon" name="icon" maxlength="2" placeholder="🍽️" />
        </div>

        <div class="field">
            <label for="new_unit">Einheit</label>
            <select id="new_unit" name="displayUnit" bind:value={newUnit}>
                <option value="Stück">Stück</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
            </select>
        </div>

        <div class="field">
            <label for="new_amount">Menge pro Einheit</label>
            <input
                id="new_amount"
                name="amountPerUnitDisplay"
                type="number"
                step="0.01"
                min="0.01"
                bind:value={newAmount}
                disabled={newUnit === "Stück"}
            />
        </div>

        <div class="field">
            <label for="new_loc">Lagerort</label>
            <select id="new_loc" name="defaultStorageLocation">
                {#each locations as loc (loc.id)}
                    <option value={loc.name}>{loc.name}</option>
                {/each}
            </select>
        </div>

        <div class="field">
            <label for="new_price">Preis pro Einheit (CHF)</label>
            <input
                id="new_price"
                name="defaultPricePerUnit"
                type="number"
                step="0.05"
                min="0"
                value="0"
            />
        </div>

        <div class="actions">
            <button class="primary" type="submit">Vorlage speichern</button>
        </div>
    </form>
</section>

<section class="card">
    <header class="list-header">
        <h2>Vorlagen</h2>

        <input
            class="search"
            type="search"
            placeholder="Vorlagen suchen…"
            bind:value={q}
        />
    </header>

    {#if filtered.length === 0}
        <p class="hint">Keine Vorlagen gefunden.</p>
    {:else}
        <div class="list">
            {#each filtered as t (t.id)}
                <details class="item">
                    <summary class="summary">
                        <span class="left">
                            <span class="emoji">{t.icon}</span>
                            <span class="name">{t.name}</span>
                        </span>
                        <span class="meta">
                            {t.amountPerUnitDisplay}
                            {t.displayUnit} • {t.defaultStorageLocation} • {t.defaultPricePerUnit.toFixed(
                                2,
                            )} CHF
                        </span>
                    </summary>

                    <div class="body">
                        <form method="POST" action="?/update" class="grid">
                            <input
                                type="hidden"
                                name="templateId"
                                value={t.id}
                            />

                            <div class="field">
                                <label for={"name_" + t.id}>Name</label>
                                <input
                                    id={"name_" + t.id}
                                    name="name"
                                    value={t.name}
                                    required
                                />
                            </div>

                            <div class="field">
                                <label for={"icon_" + t.id}>Icon</label>
                                <input
                                    id={"icon_" + t.id}
                                    name="icon"
                                    value={t.icon}
                                    maxlength="2"
                                />
                            </div>

                            <div class="field">
                                <label for={"unit_" + t.id}>Einheit</label>
                                <select
                                    id={"unit_" + t.id}
                                    name="displayUnit"
                                    value={t.displayUnit}
                                >
                                    <option value="Stück">Stück</option>
                                    <option value="g">g</option>
                                    <option value="kg">kg</option>
                                    <option value="ml">ml</option>
                                    <option value="l">l</option>
                                </select>
                            </div>

                            <div class="field">
                                <label for={"amount_" + t.id}
                                    >Menge pro Einheit</label
                                >
                                <input
                                    id={"amount_" + t.id}
                                    name="amountPerUnitDisplay"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={t.amountPerUnitDisplay}
                                    required
                                />
                            </div>

                            <div class="field">
                                <label for={"loc_" + t.id}>Lagerort</label>
                                <select
                                    id={"loc_" + t.id}
                                    name="defaultStorageLocation"
                                    value={t.defaultStorageLocation}
                                >
                                    {#each locations as loc (loc.id)}
                                        <option value={loc.name}
                                            >{loc.name}</option
                                        >
                                    {/each}
                                </select>
                            </div>

                            <div class="field">
                                <label for={"price_" + t.id}
                                    >Preis pro Einheit (CHF)</label
                                >
                                <input
                                    id={"price_" + t.id}
                                    name="defaultPricePerUnit"
                                    type="number"
                                    step="0.05"
                                    min="0"
                                    value={t.defaultPricePerUnit}
                                />
                            </div>

                            <div class="actions row">
                                <button class="primary" type="submit"
                                    >Änderungen speichern</button
                                >

                                <button
                                    class="danger"
                                    type="submit"
                                    formaction="?/delete"
                                    on:click={(e) => {
                                        if (
                                            !confirm(
                                                "Vorlage wirklich löschen?",
                                            )
                                        )
                                            e.preventDefault();
                                    }}
                                >
                                    Löschen
                                </button>
                            </div>
                        </form>
                    </div>
                </details>
            {/each}
        </div>
    {/if}
</section>

<style>
    .page-header h1 {
        margin: 0 0 0.25rem 0;
        font-size: 1.6rem;
    }
    .subtitle {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;
    }

    .card {
        background: white;
        border-radius: 1rem;
        padding: 1.25rem 1.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        margin-bottom: 1rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem 1.25rem;
        align-items: end;
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

    .actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }
    .actions.row {
        grid-column: 1 / -1;
    }

    button {
        border: none;
        border-radius: 999px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .primary {
        background: #0f766e;
        color: white;
    }
    .danger {
        background: #fee2e2;
        color: #b91c1c;
    }

    .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .search {
        border-radius: 999px;
        border: 1px solid #d1d5db;
        padding: 0.45rem 0.8rem;
        min-width: 240px;
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    .item {
        border: 1px solid #e5e7eb;
        border-radius: 0.9rem;
        background: #f9fafb;
        padding: 0.25rem 0.75rem;
    }

    .summary {
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 0;
    }

    .left {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
    }
    .emoji {
        font-size: 1.35rem;
    }
    .name {
        font-weight: 650;
        color: #111827;
    }
    .meta {
        color: #6b7280;
        font-size: 0.85rem;
    }

    .body {
        padding: 0.75rem 0 1rem;
    }
    .hint {
        color: #6b7280;
    }
</style>
