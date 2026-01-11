<script>
	export let data;

	let newName = '';

	function confirmDelete() {
		return confirm('Lagerort wirklich löschen?');
	}
</script>

<section class="header">
	<div>
		<h1>Lagerorte</h1>
		<p class="subtitle">Verwalte deine Lagerorte (hinzufügen, umbenennen, löschen).</p>
	</div>
</section>

<section class="grid">
	<article class="panel">
		<h2>Neuen Lagerort hinzufügen</h2>

		<form method="POST" action="?/add" class="row">
			<label class="sr-only" for="newName">Name</label>
			<input id="newName" placeholder="z.B. Keller" bind:value={newName} name="name" required />
			<button class="primary" type="submit">Hinzufügen</button>
		</form>

		<p class="hint">Tipp: Nutze kurze, eindeutige Namen.</p>
	</article>

	<article class="panel">
		<h2>Bestehende Lagerorte</h2>

		{#if (data.locations ?? []).length === 0}
			<p class="empty">Keine Lagerorte vorhanden.</p>
		{:else}
			<div class="list">
				{#each data.locations as loc (loc.id)}
					<div class="item">
						<form method="POST" action="?/rename" class="rename">
							<input type="hidden" name="id" value={loc.id} />
							<label class="sr-only" for={`name-${loc.id}`}>Name</label>
							<input id={`name-${loc.id}`} name="name" value={loc.name} />
							<button class="secondary" type="submit">Speichern</button>
						</form>

						<form
							method="POST"
							action="?/delete"
							on:submit={(e) => {
								if (!confirmDelete()) e.preventDefault();
							}}
						>
							<input type="hidden" name="id" value={loc.id} />
							<button class="danger" type="submit">Löschen</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</article>
</section>

<style>
	.header {
		margin-bottom: 1.25rem;
	}
	h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.6rem;
	}
	.subtitle {
		margin: 0;
		color: #6b7280;
		font-size: 0.95rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
	}
	@media (min-width: 900px) {
		.grid {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}

	.panel {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		box-shadow: 0 2px 8px rgba(0,0,0,0.04);
		padding: 1.1rem 1.25rem;
	}

	h2 {
		margin: 0 0 0.8rem 0;
		font-size: 1.1rem;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.6rem;
		align-items: center;
	}

	input {
		border: 1px solid #d1d5db;
		border-radius: 0.8rem;
		padding: 0.5rem 0.7rem;
		font-size: 0.95rem;
	}
	input:focus {
		outline: none;
		border-color: #0f766e;
		box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.2);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.8rem;
		padding: 0.7rem 0.8rem;
		border-radius: 0.9rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
	}

	.rename {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.6rem;
		align-items: center;
		width: 100%;
	}

	button {
		border: none;
		border-radius: 999px;
		padding: 0.45rem 0.9rem;
		cursor: pointer;
		font-size: 0.9rem;
		white-space: nowrap;
	}

	.primary {
		background: #0f766e;
		color: white;
	}
	.secondary {
		background: #e5e7eb;
		color: #111827;
	}
	.danger {
		background: #fee2e2;
		color: #b91c1c;
	}

	.hint {
		margin: 0.7rem 0 0 0;
		color: #6b7280;
		font-size: 0.9rem;
	}
	.empty {
		color: #6b7280;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
</style>
