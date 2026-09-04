<script lang="ts">
	import { resolve } from '$app/paths';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Avatar snapshots | Steward dashboard</title>
</svelte:head>

<main>
	<nav aria-label="Steward navigation">
		<a href={resolve('/steward')}>Steward dashboard</a>
	</nav>

	<header>
		<h1>Avatar snapshots</h1>

		<p>
			The backfill captures WebP files for custom avatar hashes stored in the users table and links
			each user row to the source SHA-256 digest.
		</p>

		<p>Users without a custom avatar hash are excluded.</p>
	</header>

	<section class="status-band" aria-labelledby="backfill-status-heading">
		<h2 id="backfill-status-heading">Backfill status</h2>

		<dl class="status-list">
			<dt>Custom avatar rows</dt>
			<dd>{data.status.customAvatars}</dd>

			<dt>Linked snapshots</dt>
			<dd>{data.status.linkedSnapshots}</dd>

			<dt>Pending snapshots</dt>
			<dd>{data.status.pendingSnapshots}</dd>
		</dl>

		<div class="action-status" aria-live="polite">
			{#if form?.message}
				<p class="error">{form.message}</p>
			{:else if form?.result}
				<p>
					Attempted: {form.result.attempted}. Linked: {form.result.linked}. Skipped: {form.result
						.skipped}. Failed: {form.result.failed}.
				</p>
			{/if}
		</div>

		{#if data.status.pendingSnapshots > 0}
			<p>
				Each request processes at most
				{data.batchSize} pending rows in sequence.
			</p>

			<form method="POST" action="?/backfill">
				<input
					type="hidden"
					name="after_discord_id"
					value={form?.result?.nextAfterDiscordId ?? ''}
				/>

				<button type="submit"> Backfill pending avatars </button>
			</form>
		{:else}
			<p>No custom-avatar rows are pending.</p>
		{/if}
	</section>
</main>

<style>
	main {
		--paper: #10171b;
		--surface: #061014;
		--ink: #f4f1e8;
		--rule: #35505c;
		--action: #ff6b61;

		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 1rem;
		--space-4: 1.5rem;
		--space-5: 2.5rem;

		box-sizing: border-box;
		min-height: 100%;
		max-width: 64rem;
		margin-inline: auto;
		padding: var(--space-5);
		background: var(--paper);
		color: var(--ink);
		font-family: 'Titillium Web', sans-serif;
		line-height: 1.5;
	}

	nav {
		margin-block-end: var(--space-5);
	}

	a {
		color: var(--action);
		text-underline-offset: var(--space-1);
	}

	header {
		margin-block-end: var(--space-5);
	}

	h1,
	h2,
	p {
		margin-block-start: 0;
	}

	h1 {
		margin-block-end: var(--space-3);
		font-size: clamp(2rem, 8vw, 4rem);
		line-height: 1;
		text-transform: uppercase;
	}

	h2 {
		margin-block-end: var(--space-3);
		font-size: 1.5rem;
		line-height: 1.2;
	}

	header p {
		max-width: 68ch;
		margin-block-end: var(--space-2);
	}

	.status-band {
		width: calc(100% + var(--space-5));
		margin-inline-end: calc(-1 * var(--space-5));
		padding: var(--space-4);
		border-block: 1px solid var(--rule);
		background: var(--surface);
	}

	.status-list {
		display: grid;
		grid-template-columns: minmax(0, 1fr) max-content;
		margin: 0;
	}

	.status-list dt,
	.status-list dd {
		padding-block: var(--space-2);
		border-bottom: 1px solid var(--rule);
	}

	.status-list dd {
		margin: 0;
		font-family: 'Courier New', monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		text-align: right;
	}

	.action-status {
		min-height: var(--space-4);
		margin-block-start: var(--space-3);
	}

	.action-status p,
	.status-band > p {
		margin-block-end: var(--space-3);
	}

	.error {
		color: var(--action);
		font-weight: 700;
	}

	form {
		margin-block-start: var(--space-4);
	}

	button {
		min-height: 2.75rem;
		padding-inline: var(--space-4);
		border: 1px solid var(--action);
		background: var(--action);
		color: var(--surface);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	a:focus-visible,
	button:focus-visible {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}

	@media (max-width: 48rem) {
		main {
			padding: var(--space-3);
		}

		.status-band {
			width: calc(100% + var(--space-3));
			margin-inline-end: calc(-1 * var(--space-3));
			padding: var(--space-3);
		}
	}
</style>
