<script lang="ts">
	import { resolve } from '$app/paths';
	import DiscordAvatar from '$lib/components/DiscordAvatar.svelte';

	let { data } = $props();

	const submitHref = resolve('/submit');
	const individualsHref = resolve('/season-4/individuals');
	const teamsHref = resolve('/season-4/teams');

	let standings = $derived(data.standings);
	let individualPreview = $derived(standings.individuals.slice(0, 5));
	let teamPreview = $derived(standings.teams.slice(0, 5));
</script>

<svelte:head>
	<title>Holo F1 — Season 4</title>
	<meta name="description" content="Season 4 prediction standings." />
</svelte:head>

<div class="home-shell">
	<header class="site-header">
		<div class="masthead">
			<span class="wordmark">Holo F1</span>

			{#if data.user}
				<div class="account">
					<DiscordAvatar
						discordId={data.user.discord_id}
						avatarHash={data.user.avatar_hash}
						size={40}
						alt=""
					/>

					<span>{data.user.display_name}</span>
				</div>
			{/if}
		</div>
	</header>

	<main class="home-main">
		<section class="hero" aria-labelledby="home-heading">
			<h1 id="home-heading">Season 4 predictions</h1>

			<nav class="primary-actions" aria-label="Season 4">
				<a class="primary-action" href={submitHref}> Submit prediction </a>

				<a href={individualsHref}> Individual standings </a>

				<a href={teamsHref}> Team standings </a>
			</nav>
		</section>

		<section class="season-band" aria-label="Season 4 summary">
			<dl class="season-summary">
				<div>
					<dt>Scored weekends</dt>
					<dd>{standings.weekends.length}</dd>
				</div>

				<div>
					<dt>Participants</dt>
					<dd>{standings.individuals.length}</dd>
				</div>

				<div>
					<dt>Teams</dt>
					<dd>{standings.teams.length}</dd>
				</div>
			</dl>
		</section>

		<div class="standings-preview">
			<section
				class="standings-panel individual-panel"
				aria-labelledby="individual-preview-heading"
			>
				<header class="section-heading">
					<h2 id="individual-preview-heading">Individual standings</h2>

					<a href={individualsHref}> View individual standings </a>
				</header>

				{#if individualPreview.length === 0}
					<p class="empty-state">No published individual scores.</p>
				{:else}
					<div class="table-scroll">
						<table class="preview-table">
							<thead>
								<tr>
									<th scope="col">Rank</th>
									<th scope="col"> Participant </th>
									<th scope="col">Points</th>
								</tr>
							</thead>

							<tbody>
								{#each individualPreview as standing (standing.id)}
									<tr>
										<td class="rank">
											{standing.rank}
										</td>

										<th scope="row">
											{standing.name}
										</th>

										<td class="points">
											{standing.totalPoints}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<section class="standings-panel team-panel" aria-labelledby="team-preview-heading">
				<header class="section-heading">
					<h2 id="team-preview-heading">Team standings</h2>

					<a href={teamsHref}> View team standings </a>
				</header>

				{#if teamPreview.length === 0}
					<p class="empty-state">No published team scores.</p>
				{:else}
					<div class="table-scroll">
						<table class="preview-table">
							<thead>
								<tr>
									<th scope="col">Rank</th>
									<th scope="col">Team</th>
									<th scope="col">Points</th>
								</tr>
							</thead>

							<tbody>
								{#each teamPreview as standing (standing.id)}
									<tr>
										<td class="rank">
											{standing.rank}
										</td>

										<th scope="row">
											<span class="team-name">
												<span
													class="team-mark"
													style:--team-color={standing.color?.trim() || '#ff5148'}
													aria-hidden="true"
												></span>

												{standing.name}
											</span>
										</th>

										<td class="points">
											{standing.totalPoints}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>
		</div>
	</main>
</div>

<style>
	.home-shell {
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

		--content-width: 72rem;

		min-height: 100vh;
		overflow-x: clip;
		background: var(--page);
		color: var(--ink);
		font-family: 'Titillium Web', sans-serif;
		line-height: 1.5;
	}

	.home-shell *,
	.home-shell *::before,
	.home-shell *::after {
		box-sizing: border-box;
	}

	.site-header {
		border-bottom: 1px solid var(--rule);
	}

	.masthead {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		max-width: var(--content-width);
		min-height: 4.5rem;
		margin-inline: auto;
		padding-inline: var(--space-4);
	}

	.wordmark {
		font-size: 1.5rem;
		font-weight: 900;
		line-height: 1;
		text-transform: uppercase;
	}

	.account {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 700;
	}

	.home-main {
		max-width: var(--content-width);
		margin-inline: auto;
		padding: var(--space-5) var(--space-4);
	}

	.hero {
		max-width: 58rem;
		padding-block: var(--space-5);
	}

	.hero h1 {
		max-width: 11ch;
		margin: 0;
		font-size: clamp(3rem, 9vw, 7rem);
		font-weight: 900;
		letter-spacing: -0.035em;
		line-height: 0.88;
		text-transform: uppercase;
	}

	.primary-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-block-start: var(--space-5);
	}

	.primary-actions a,
	.section-heading a {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		color: inherit;
		font-weight: 700;
		text-decoration-thickness: 1px;
		text-underline-offset: var(--space-1);
	}

	.primary-actions a {
		padding-inline: var(--space-3);
		border: 1px solid var(--rule);
		text-decoration: none;
	}

	.primary-actions .primary-action {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--page);
	}

	.primary-actions a:hover,
	.section-heading a:hover {
		text-decoration: underline;
	}

	.primary-actions a:focus-visible,
	.section-heading a:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.season-band {
		margin-inline: calc(50% - 50vw);
		padding-block: var(--space-4);
		border-block: 1px solid var(--rule);
		background: var(--surface);
	}

	.season-summary {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
		max-width: var(--content-width);
		margin: 0 auto;
		padding-inline: var(--space-4);
	}

	.season-summary > div {
		min-width: 10rem;
		padding-inline-start: var(--space-3);
		border-inline-start: var(--space-1) solid var(--rule);
	}

	.season-summary dt {
		opacity: 0.72;
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.season-summary dd {
		margin: var(--space-1) 0 0;
		font-family: 'Courier New', monospace;
		font-size: 2rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		line-height: 1;
	}

	.standings-preview {
		display: grid;
		grid-template-columns:
			minmax(0, 3fr)
			minmax(18rem, 2fr);
		gap: var(--space-5);
		align-items: start;
		margin-block-start: var(--space-5);
	}

	.standings-panel {
		min-width: 0;
		border-top: var(--space-1) solid var(--rule);
	}

	.individual-panel {
		border-top-color: var(--accent);
	}

	.section-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-4);
		padding-block: var(--space-3);
	}

	.section-heading h2 {
		margin: 0;
		font-size: clamp(1.5rem, 4vw, 2.25rem);
		line-height: 1;
	}

	.section-heading a {
		flex: 0 0 auto;
		font-size: 0.875rem;
	}

	.table-scroll {
		overflow-x: auto;
		background: var(--surface);
		overscroll-behavior-inline: contain;
	}

	.preview-table {
		width: 100%;
		min-width: 28rem;
		border-collapse: collapse;
		text-align: left;
	}

	.preview-table th,
	.preview-table td {
		height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--rule);
		vertical-align: middle;
	}

	.preview-table thead th {
		opacity: 0.72;
		font-size: 0.75rem;
		text-transform: uppercase;
	}

	.preview-table tbody th {
		font-weight: 700;
	}

	.preview-table tbody tr:last-child > * {
		border-bottom: 0;
	}

	.rank,
	.points {
		font-family: 'Courier New', monospace;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.rank {
		width: 4rem;
	}

	.points {
		width: 5rem;
		font-size: 1.125rem;
		font-weight: 700;
	}

	.team-name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.team-mark {
		flex: 0 0 auto;
		width: var(--space-1);
		height: var(--space-3);
		background: var(--team-color);
	}

	.empty-state {
		margin: 0;
		padding-block: var(--space-4);
		border-block: 1px solid var(--rule);
	}

	@media (max-width: 48rem) {
		.masthead {
			min-height: 4rem;
			padding-inline: var(--space-3);
		}

		.home-main {
			padding: var(--space-4) var(--space-3) var(--space-5);
		}

		.hero {
			padding-block: var(--space-4) var(--space-5);
		}

		.primary-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.primary-actions a {
			justify-content: flex-start;
			width: 100%;
		}

		.season-band {
			margin-inline: calc(50% - 50vw);
		}

		.season-summary {
			gap: var(--space-4);
			padding-inline: var(--space-3);
		}

		.season-summary > div {
			flex: 1 1 8rem;
		}

		.standings-preview {
			grid-template-columns: minmax(0, 1fr);
		}

		.section-heading {
			align-items: flex-start;
			flex-direction: column;
			gap: var(--space-2);
		}
	}
</style>
