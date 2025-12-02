<script>
	export let title = 'Titel';
	export let value = '';
	export let subtitle = '';
	export let icon = '📦';
	export let variant = 'default'; // 'default' | 'warning' | 'money'

	$: cardClass =
		variant === 'warning'
			? 'card warning'
			: variant === 'money'
			? 'card money'
			: 'card';
</script>

<article class={cardClass}>
	<div class="icon">{icon}</div>
	<div class="text">
		<p class="title">{title}</p>
		<p class="value">{value}</p>
		{#if subtitle}
			<p class="subtitle">{subtitle}</p>
		{/if}
	</div>
</article>

<style>
	.card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.9rem 1.1rem;
		border-radius: 0.9rem;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
	}

	.card.warning {
		background: #fffbeb;
		border-color: #f97316;
	}

	.card.money {
		background: #ecfdf5;
		border-color: #16a34a;
	}

	.icon {
		width: 36px;
		height: 36px;
		border-radius: 0.8rem;
		background: #e5e7eb;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.4rem;
	}

	.card.warning .icon {
		background: #fef3c7;
	}

	.card.money .icon {
		background: #dcfce7;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.title {
		margin: 0;
		font-size: 0.85rem;
		color: #6b7280;
	}

	.value {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
		color: #111827;
	}

	.subtitle {
		margin: 0;
		font-size: 0.8rem;
		color: #9ca3af;
	}
</style>
