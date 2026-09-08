<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DiscordAvatar from '$lib/components/DiscordAvatar.svelte';
	import ProgressionChart from '$lib/components/ProgressionChart.svelte';
	import {
		buildIndividualComparisonSearch,
		buildIndividualComparisonSeries,
		getComparisonParticipantIds,
		removeIndividualComparisonParticipant
	} from '$lib/individual-comparison';

	let { data } = $props();

	let standings = $derived(data.standings.individuals);
	let weekends = $derived(data.standings.weekends);

	let participantIds = $derived(getComparisonParticipantIds(page.url.searchParams, standings));

	let comparisonSeries = $derived(buildIndividualComparisonSeries(standings, participantIds));

	function comparisonPathAfterRemoving(
		participantId: string
	): '/season-4/individuals/compare' | `/season-4/individuals/compare?${string}` {
		const search = buildIndividualComparisonSearch(
			removeIndividualComparisonParticipant(participantIds, participantId)
		);

		return search === ''
			? '/season-4/individuals/compare'
			: `/season-4/individuals/compare?${search}`;
	}
</script>

<svelte:head>
	<title>Compare Season 4 participants</title>
	<meta name="description" content="Compare Season 4 individual points progression." />
</svelte:head>

<main class="standings-page comparison-page">
	<header class="standings-heading">
		<h1>Compare participants</h1>

		<dl class="season-summary">
			<div>
				<dt>Selected participants</dt>
				<dd>{comparisonSeries.length}</dd>
			</div>

			<div>
				<dt>Scored weekends</dt>
				<dd>{weekends.length}</dd>
			</div>
		</dl>
	</header>

	{#if comparisonSeries.length === 0}
		<p class="empty-state">No participants selected.</p>

		<a class="primary-action" href={resolve('/season-4/individuals')}>Choose participants</a>
	{:else}
		<section aria-labelledby="selected-participants">
			<div class="section-heading">
				<h2 id="selected-participants">Selected participants</h2>

				<a
					href={resolve(`/season-4/individuals?${buildIndividualComparisonSearch(participantIds)}`)}
				>
					Change selection
				</a>
			</div>

			<div class="selected-participants" style={`--comparison-count: ${comparisonSeries.length}`}>
				{#each comparisonSeries as item (item.id)}
					<article class="selected-participant" style:border-inline-start-color={item.color}>
						<div class="participant-identity">
							<DiscordAvatar
								defaultAvatarIndex={item.defaultAvatarIndex}
								avatarSnapshotSha256={item.avatarSnapshotSha256}
								size={40}
								alt=""
							/>

							<h3>{item.name}</h3>
						</div>

						<p class="participant-points">
							{item.totalPoints}
							{item.totalPoints === 1 ? 'point' : 'points'}
						</p>

						<a href={resolve(comparisonPathAfterRemoving(item.id))}>
							Remove {item.name}
						</a>
					</article>
				{/each}
			</div>
		</section>

		<section class="progression-section" aria-labelledby="points-progression">
			<h2 id="points-progression">Points progression</h2>

			<div class="chart-breakout">
				<ProgressionChart
					title="Individual points progression"
					{weekends}
					series={comparisonSeries}
				/>
			</div>
		</section>
	{/if}
</main>

<style>
	.comparison-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.section-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-3);
		margin-block-end: var(--space-3);
	}

	.section-heading h2,
	.progression-section h2 {
		margin: 0;
	}

	.section-heading a,
	.selected-participant a,
	.primary-action {
		color: var(--accent);
		font-weight: 700;
	}

	.section-heading a:focus-visible,
	.selected-participant a:focus-visible,
	.primary-action:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.selected-participants {
		display: grid;
		grid-template-columns: repeat(var(--comparison-count), minmax(0, 1fr));
		border-block: 1px solid var(--rule);
	}

	.selected-participant {
		min-width: 0;
		padding: var(--space-4);
		border-inline-start: var(--space-1) solid transparent;
	}

	.selected-participant + .selected-participant {
		border-block-start: 0;
	}

	.participant-identity {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.participant-identity h3 {
		min-width: 0;
		margin: 0;
		overflow-wrap: anywhere;
	}

	.participant-points {
		margin-block: var(--space-3);
		font-family: 'Courier New', monospace;
		font-size: 1.25rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}

	.progression-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.chart-breakout {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		overflow-x: auto;
		border-block: 1px solid var(--rule);
	}

	.primary-action {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		min-height: 2.75rem;
		padding-inline: var(--space-4);
		border: 1px solid var(--accent);
		text-decoration: none;
	}

	@media (max-width: 48rem) {
		.selected-participants {
			grid-template-columns: 1fr;
		}

		.selected-participant + .selected-participant {
			border-block-start: 1px solid var(--rule);
		}
	}
</style>
