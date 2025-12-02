<script>
	const steps = [
		{
			title: '1. Inventar aufbauen',
			text: 'Füge deine Lebensmittel im Inventar hinzu – am besten direkt nach dem Einkauf. Du kannst Vorlagen nutzen, damit Lieblingsprodukte schnell wieder hinzugefügt werden.'
		},
		{
			title: '2. Überblick behalten',
			text: 'Sieh auf einen Blick, was du zuhause hast, wo es lagert und wie viel es wert ist. Filter helfen dir, z.B. nur den Kühlschrank oder Produkte mit kurzem Ablaufdatum zu sehen.'
		},
		{
			title: '3. Bewusst verbrauchen & Food Waste reduzieren',
			text: 'Nutze die Buttons in den Produktkarten, um zu markieren, ob etwas verbraucht oder entsorgt wurde. So entsteht eine Statistik über Verbrauch und Lebensmittelabfall.'
		}
	];

	const actions = [
		{
			label: '➖ Minus',
			title: '1 Einheit verbraucht',
			text: 'Du hast eine Portion / Einheit aufgegessen. Die Menge im Inventar wird reduziert und der Verbrauch kann später in der Statistik ausgewertet werden.'
		},
		{
			label: '⚠ Müll-Button',
			title: 'Variante entsorgt',
			text: 'Du musst eine Variante (z.B. abgelaufene Jogurts) wegwerfen. Diese Menge wird aus dem Inventar entfernt und als Food-Waste erfasst.'
		},
		{
			label: 'Löschen',
			title: 'Produkt aus Inventar entfernen',
			text: 'Das Produkt wird komplett aus dem Inventar entfernt. Nutze das vor allem, wenn ein Produkt leer ist oder du es nicht mehr tracken möchtest.'
		},
		{
			label: 'Alles entsorgen',
			title: 'Komplettes Produkt in den Müll',
			text: 'Wenn du ein ganzes Produkt (inklusive aller Varianten) entsorgen musst, entfernst du es hiermit vollständig aus dem Inventar. Die Menge wird als Food-Waste verbucht.'
		}
	];
</script>

<main class="welcome">
	<section class="hero">
		<div class="hero-text">
			<p class="badge">Prototyp • Smart Food Planner</p>
			<h1>Willkommen beim Smart Food Planner 🥕</h1>
			<p class="lead">
				Diese App hilft dir, den Überblick über deine Lebensmittel zu behalten,
				Food Waste zu reduzieren und dein Budget im Blick zu haben.
			</p>

			<div class="hero-actions">
				<a href="/inventar" class="primary-button">Zum Inventar</a>
				<a href="/statistiken" class="secondary-button">Statistiken ansehen</a>
			</div>

			<p class="hint">
				Tipp: Starte mit dem Inventar und füge ein paar typische Produkte hinzu
				(z.B. Jogurts, Brot, Gemüse).
			</p>
		</div>
	</section>

	<section class="section">
		<h2>Wie funktioniert die App?</h2>
		<div class="steps-grid">
			{#each steps as step}
				<article class="step-card">
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="section">
		<h2>Wichtige Aktionen im Inventar</h2>
		<p class="section-intro">
			In jeder Produktkarte gibt es mehrere Aktionen. So kannst du genau festhalten,
			ob etwas wirklich gegessen wurde oder im Müll landet.
		</p>

		<div class="actions-grid">
			{#each actions as action}
				<article class="action-card">
					<p class="action-label">{action.label}</p>
					<h3>{action.title}</h3>
					<p>{action.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="section">
		<h2>Warum nicht einfach nur löschen?</h2>
		<div class="info-card">
			<p>
				Wenn du Lebensmittel einfach nur entfernst, weiß das System nicht,
				ob du sie <strong>gegessen</strong> oder <strong>weggeworfen</strong> hast.
			</p>
			<p>
				Darum ist der <strong>Unterschied zwischen „verbraucht“ (Minus-Button)
				und „Müll“ (⚠-Button / „Alles entsorgen“)</strong> wichtig:
			</p>
			<ul>
				<li><strong>Verbraucht</strong> → gut, du nutzt deine Einkäufe sinnvoll.</li>
				<li><strong>Entsorgt</strong> → wird in der Food-Waste-Statistik sichtbar.</li>
			</ul>
			<p>
				So kannst du später sehen, wie sich dein Verhalten entwickelt – und ob du
				z.B. schaffst, jede Woche weniger wegzuwerfen.
			</p>
		</div>
	</section>
</main>

<style>
	.welcome {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.hero {
		background: radial-gradient(circle at top left, #bbf7d0, #ecfdf5);
		border-radius: 1.5rem;
		padding: 1.75rem 1.75rem 1.5rem;
		border: 1px solid #bbf7d0;
	}

	.hero-text {
		max-width: 640px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		background: rgba(22, 163, 74, 0.08);
		color: #15803d;
		font-size: 0.75rem;
		margin: 0 0 0.5rem 0;
	}

	h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}

	.lead {
		margin: 0 0 1rem 0;
		color: #4b5563;
		font-size: 0.98rem;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-bottom: 0.5rem;
	}

	.primary-button,
	.secondary-button {
		border-radius: 999px;
		padding: 0.55rem 1.2rem;
		font-size: 0.9rem;
		border: none;
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
		background: white;
		color: #0f766e;
		border: 1px solid rgba(15, 118, 110, 0.2);
	}

	.hint {
		margin: 0;
		color: #6b7280;
		font-size: 0.85rem;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section h2 {
		margin: 0;
		font-size: 1.3rem;
	}

	.section-intro {
		margin: 0;
		color: #4b5563;
		font-size: 0.9rem;
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.step-card {
		background: white;
		border-radius: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		font-size: 0.9rem;
		color: #374151;
	}

	.step-card h3 {
		margin: 0 0 0.4rem 0;
		font-size: 1rem;
	}

	.actions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.action-card {
		background: white;
		border-radius: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		font-size: 0.9rem;
		color: #374151;
	}

	.action-label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 999px;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		background: #f3f4f6;
		color: #111827;
		margin: 0 0 0.3rem 0;
	}

	.action-card h3 {
		margin: 0 0 0.35rem 0;
		font-size: 0.95rem;
	}

	.info-card {
		background: #f9fafb;
		border-radius: 1rem;
		padding: 1rem 1.1rem;
		border: 1px solid #e5e7eb;
		font-size: 0.9rem;
		color: #374151;
	}

	.info-card p {
		margin: 0 0 0.4rem 0;
	}

	.info-card ul {
		margin: 0 0 0.4rem 1.1rem;
		padding: 0;
	}
</style>
