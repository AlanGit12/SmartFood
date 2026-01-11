<script>
	import '$lib/styles/forms.css';

	let token = '';

	function confirmOrCancel(message, event) {
		if (!confirm(message)) {
			event.preventDefault();
		}
	}
</script>

<section class="page-header">
	<div>
		<h1>Admin Reset</h1>
		<p class="subtitle">Testdaten und Inhalte gezielt zurücksetzen</p>
	</div>
</section>

<section class="form">
	<!-- ========================= -->
	<!-- AUTH -->
	<!-- ========================= -->
	<section class="card">
		<h2>Authentifizierung</h2>

		<div class="field">
			<label for="token">Admin Token</label>
			<input
				id="token"
				name="token"
				bind:value={token}
				placeholder="ADMIN_TOKEN"
			/>
			<p class="field-hint">
				Token wird nicht gespeichert – nur für diese Sitzung.
			</p>
		</div>
	</section>

	<!-- ========================= -->
	<!-- SINGLE RESETS -->
	<!-- ========================= -->
	<section class="card">
		<h2>Einzelne Resets</h2>

		<form method="POST" action="?/clearProducts">
			<input type="hidden" name="token" value={token} />
			<button
				type="submit"
				class="small-button"
				on:click={(e) =>
					confirmOrCancel('Inventar wirklich komplett leeren?', e)
				}
			>
				Inventar leeren
			</button>
		</form>

		<form method="POST" action="?/clearEvents">
			<input type="hidden" name="token" value={token} />
			<button
				type="submit"
				class="small-button"
				on:click={(e) =>
					confirmOrCancel('Statistiken wirklich komplett leeren?', e)
				}
			>
				Statistiken leeren
			</button>
		</form>

		<form method="POST" action="?/clearTemplates">
			<input type="hidden" name="token" value={token} />
			<button
				type="submit"
				class="small-button"
				on:click={(e) =>
					confirmOrCancel('Vorlagen wirklich komplett leeren?', e)
				}
			>
				Vorlagen leeren
			</button>
		</form>

		<form method="POST" action="?/resetLocations">
			<input type="hidden" name="token" value={token} />
			<button
				type="submit"
				class="small-button"
				on:click={(e) =>
					confirmOrCancel('Lagerorte auf Standard zurücksetzen?', e)
				}
			>
				Lagerorte zurücksetzen
			</button>
		</form>
	</section>

	<!-- ========================= -->
	<!-- DANGER ZONE -->
	<!-- ========================= -->
	<section class="card danger">
		<h2>Alles zurücksetzen</h2>

		<p class="field-hint">
			Löscht Inventar, Statistiken, Vorlagen und setzt Lagerorte zurück.
		</p>

		<form method="POST" action="?/resetAll">
			<input type="hidden" name="token" value={token} />
			<button
				type="submit"
				class="danger-button"
				on:click={(e) =>
					confirmOrCancel(
						'WIRKLICH ALLES löschen?\n\nInventar, Statistiken, Vorlagen & Lagerorte',
						e
					)
				}
			>
				ALLES RESETTEN
			</button>
		</form>
	</section>
</section>

<style>
	/* Danger Zone Styling */
	.card.danger {
		border-color: #fecaca;
		background: #fef2f2;
	}

	.danger-button {
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 999px;
		padding: 0.55rem 1.4rem;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.danger-button:hover {
		background: #b91c1c;
	}
</style>
