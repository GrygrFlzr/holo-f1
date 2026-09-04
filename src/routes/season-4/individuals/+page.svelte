<script lang="ts">
	import DiscordAvatar from '$lib/components/DiscordAvatar.svelte';
	import ProgressionSparkline from '$lib/components/ProgressionSparkline.svelte';

	let { data } = $props();

	const raceScores = [6, 5, 4, 3, 2, 1, 0] as const;

	let standings = $derived(data.standings.individuals);
	let weekendCount = $derived(data.standings.weekends.length);
</script>

<svelte:head>
	<title>Season 4 individual standings</title>
	<meta name="description" content="Season 4 individual prediction standings." />
</svelte:head>

<main class="standings-page">
	<header class="standings-heading">
		<h1 id="individual-standings">Individual standings</h1>

		<dl class="season-summary">
			<div>
				<dt>Scored weekends</dt>
				<dd>{weekendCount}</dd>
			</div>

			<div>
				<dt>Participants</dt>
				<dd>{standings.length}</dd>
			</div>
		</dl>
	</header>

	{#if standings.length === 0}
		<p class="empty-state">No published individual scores.</p>
	{:else}
		<section class="standings-section" aria-labelledby="individual-standings">
			<div class="table-scroll">
				<table class="standings-table" aria-labelledby="individual-standings">
					<thead>
						<tr>
							<th scope="col">Rank</th>
							<th scope="col">Participant</th>
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
									<span class="participant">
										<DiscordAvatar
											discordId={standing.id}
											avatarSnapshotSha256={standing.avatarSnapshotSha256}
											size={32}
											alt=""
										/>

										<span>{standing.name}</span>
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
	.participant {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>
