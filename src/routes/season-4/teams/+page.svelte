<script lang="ts">
	import ProgressionChart from '$lib/components/ProgressionChart.svelte';
	import ProgressionSparkline from '$lib/components/ProgressionSparkline.svelte';

	let { data } = $props();

	const raceScores = [6, 5, 4, 3, 2, 1, 0] as const;

	let standings = $derived(data.standings.teams);
	let weekends = $derived(data.standings.weekends);
</script>

<svelte:head>
	<title>Season 4 team standings</title>
	<meta name="description" content="Season 4 team prediction standings." />
</svelte:head>

<main class="standings-page">
	<header class="standings-heading">
		<h1 id="team-standings">Team standings</h1>

		<dl class="season-summary">
			<div>
				<dt>Scored weekends</dt>
				<dd>{weekends.length}</dd>
			</div>

			<div>
				<dt>Teams</dt>
				<dd>{standings.length}</dd>
			</div>
		</dl>
	</header>

	{#if standings.length === 0}
		<p class="empty-state">No published team scores.</p>
	{:else}
		<section class="standings-section" aria-labelledby="progression-heading">
			<h2 id="progression-heading">Points progression</h2>

			<div class="chart-breakout">
				<ProgressionChart title="Team points progression" {weekends} series={standings} />
			</div>
		</section>

		<section class="standings-section" aria-labelledby="team-standings">
			<div class="table-scroll">
				<table class="standings-table" aria-labelledby="team-standings">
					<thead>
						<tr>
							<th scope="col">Rank</th>
							<th scope="col">Team</th>
							<th scope="col">Points</th>
							<th scope="col">Entries</th>
							<th scope="col">Bold points</th>

							{#each raceScores as raceScore (raceScore)}
								<th scope="col">
									{raceScore}/6
								</th>
							{/each}

							<th scope="col">Progression</th>
						</tr>
					</thead>

					<tbody>
						{#each standings as standing (standing.id)}
							<tr>
								<td class="rank">
									{standing.rank}
								</td>

								<th scope="row">
									<span class="team-name">
										<span class="team-mark" style:--team-color={standing.color?.trim() || '#ff5148'}
										></span>

										{standing.name}
									</span>
								</th>

								<td class="score">
									{standing.totalPoints}
								</td>

								<td class="count">
									{standing.participation}
								</td>

								<td class="count">
									{standing.boldPoints}
								</td>

								{#each raceScores as raceScore (raceScore)}
									<td class="count">
										{standing.histogram[raceScore]}
									</td>
								{/each}

								<td class="progression">
									<ProgressionSparkline
										history={standing.history}
										label={`${standing.name} cumulative points`}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</main>

<style>
	.team-name {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 700;
	}

	.team-mark {
		flex: 0 0 auto;
		width: var(--space-1);
		height: var(--space-4);
		background: var(--team-color);
	}
</style>
