<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { children } = $props();

	const individualsHref = resolve('/season-4/individuals');
	const teamsHref = resolve('/season-4/teams');
	const resultsHref = resolve('/season-4/results');
</script>

<div class="season-shell">
	<header class="season-header">
		<a class="season-title" href={individualsHref}> Season 4 </a>

		<nav class="season-nav" aria-label="Season 4">
			<a
				href={individualsHref}
				aria-current={page.url.pathname === individualsHref ||
				page.url.pathname.startsWith(`${individualsHref}/`)
					? 'page'
					: undefined}
			>
				Individuals
			</a>

			<a href={teamsHref} aria-current={page.url.pathname === teamsHref ? 'page' : undefined}>
				Teams
			</a>

			<a href={resultsHref} aria-current={page.url.pathname === resultsHref ? 'page' : undefined}>
				Results
			</a>
		</nav>
	</header>

	{@render children()}
</div>

<style>
	.season-shell {
		--page: #15151d;
		--surface: #071821;
		--ink: #f7f4ed;
		--rule: #35505c;
		--accent: #ff5148;

		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 1rem;
		--space-4: 1.5rem;
		--space-5: 2.5rem;

		min-height: 100vh;
		background: var(--page);
		color: var(--ink);
		font-family: 'Titillium Web', sans-serif;
		line-height: 1.5;
	}

	.season-shell :global(*),
	.season-shell :global(*::before),
	.season-shell :global(*::after) {
		box-sizing: border-box;
	}

	.season-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		max-width: 72rem;
		margin-inline: auto;
		padding: var(--space-4);
		border-bottom: 1px solid var(--rule);
	}

	.season-title {
		color: inherit;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1;
		text-decoration: none;
		text-transform: uppercase;
	}

	.season-nav {
		display: flex;
		align-items: stretch;
		gap: var(--space-2);
	}

	.season-nav a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding-inline: var(--space-3);
		border-bottom: var(--space-1) solid transparent;
		color: inherit;
		font-weight: 700;
		text-decoration: none;
	}

	.season-nav a[aria-current='page'] {
		border-bottom-color: var(--accent);
	}

	.season-nav a:focus-visible,
	.season-title:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.season-shell :global(.standings-page) {
		max-width: 72rem;
		margin-inline: auto;
		padding: var(--space-5) var(--space-4);
	}

	.season-shell :global(.standings-heading) {
		margin-block-end: var(--space-5);
	}

	.season-shell :global(.standings-heading) :global(h1) {
		max-width: 14ch;
		margin: 0;
		font-size: clamp(2.5rem, 8vw, 5.5rem);
		font-weight: 900;
		line-height: 0.92;
		text-transform: uppercase;
	}

	.season-shell :global(.season-summary) {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
		gap: var(--space-3);
		margin: var(--space-4) 0 0;
	}

	.season-shell :global(.season-summary) > :global(div) {
		padding-inline-start: var(--space-3);
		border-inline-start: var(--space-1) solid var(--rule);
	}

	.season-shell :global(.season-summary) :global(dt) {
		opacity: 0.68;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.season-shell :global(.season-summary) :global(dd) {
		margin: var(--space-1) 0 0;
		font-family: 'Courier New', monospace;
		font-size: 1.75rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}

	.season-shell :global(.standings-section) {
		margin-block-start: var(--space-5);
	}

	.season-shell :global(.standings-section) :global(h2) {
		margin: 0 0 var(--space-3);
		font-size: clamp(1.75rem, 4vw, 2.75rem);
		line-height: 1;
	}

	.season-shell :global(.chart-breakout) {
		position: relative;
		left: 50%;
		width: min(96rem, calc(100vw - var(--space-4) * 2));
		overflow-x: auto;
		transform: translateX(-50%);
		overscroll-behavior-inline: contain;
	}

	.season-shell :global(.table-scroll) {
		width: calc(100% + var(--space-4));
		margin-inline-end: calc(-1 * var(--space-4));
		overflow-x: auto;
		background: var(--surface);
		overscroll-behavior-inline: contain;
	}

	.season-shell :global(.standings-table) {
		width: 100%;
		min-width: 70rem;
		border-collapse: collapse;
		text-align: left;
	}

	.season-shell :global(.standings-table) :global(th),
	.season-shell :global(.standings-table) :global(td) {
		height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--rule);
		vertical-align: middle;
		white-space: nowrap;
	}

	.season-shell :global(.standings-table) :global(th) {
		opacity: 0.68;
		font-size: 0.8125rem;
		text-transform: uppercase;
	}

	.season-shell :global(.standings-table) :global(tbody) :global(tr:last-child) :global(td),
	.season-shell :global(.standings-table) :global(tbody) :global(tr:last-child) :global(th) {
		border-bottom: 0;
	}

	.season-shell :global(.standings-table) :global(tbody) :global(tr:hover) {
		background: color-mix(in srgb, var(--rule) 24%, transparent);
	}

	.season-shell :global(.standings-table) :global(.rank),
	.season-shell :global(.standings-table) :global(.score),
	.season-shell :global(.standings-table) :global(.count) {
		font-family: 'Courier New', monospace;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.season-shell :global(.standings-table) :global(.rank) {
		width: 4rem;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.season-shell :global(.standings-table) :global(.score) {
		font-size: 1.25rem;
		font-weight: 700;
	}

	.season-shell :global(.standings-table) :global(.progression) {
		width: 11rem;
		color: var(--accent);
	}

	.season-shell :global(.empty-state) {
		margin-block: var(--space-5);
		padding-block: var(--space-4);
		border-block: 1px solid var(--rule);
	}

	@media (max-width: 44rem) {
		.season-header {
			align-items: flex-start;
			flex-direction: column;
			gap: var(--space-3);
			padding: var(--space-3);
		}

		.season-nav {
			width: 100%;
		}

		.season-nav a {
			flex: 1 1 auto;
			justify-content: flex-start;
		}

		.season-shell :global(.standings-page) {
			padding: var(--space-5) var(--space-3);
		}

		.season-shell :global(.chart-breakout) {
			width: calc(100vw - var(--space-3) * 2);
		}

		.season-shell :global(.table-scroll) {
			width: calc(100% + var(--space-3));
			margin-inline-end: calc(-1 * var(--space-3));
		}
	}
</style>
