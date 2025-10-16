<script lang="ts">
	import type { PageProps } from './$types';
	import pngLogo from '$lib/assets/logo.png?no-inline';
	let { data }: PageProps = $props();
	const rankEmojis = ['🥇', '🥈', '🥉'];
	const description = data.teams
		.filter((team) => team.rank <= 3)
		.map((team) => `${rankEmojis[team.rank - 1]} ${team.name} // ${team.points}`)
		.join('\n');
</script>

<svelte:head>
	<meta property="og:title" content="Season 3 Team Standings" />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={pngLogo} />
	<meta property="og:image:width" content="1193" />
	<meta property="og:image:height" content="188" />
	<meta property="twitter:card" content="summary_large_image" />
	<title>Season 3 Team Standings | Holocord F1 Watchalong Prediction Championship</title>
</svelte:head>

<h2 class="page-header">Season 3 Team Standings</h2>

<ul class="team-rankings">
	{#each data.teams as team (team.name)}
		<li class="team-entry" style="--team-color: {team.color}">
			<img class="team-logo" src={team.repImage} alt="{team.name} rep logo" />
			<span class="team-rank">#{team.rank}</span>
			<span class="team-name">{team.name}</span>
			<span class="team-pts">{team.points}</span>
		</li>
		<li class="team-breakdown-wrapper">
			<ul class="team-breakdown-inner">
				{#each team.scorers as scorer (scorer.name)}
					<li class="scorer-entry" style="--team-color: {team.color}">
						<span class="scorer-name">{scorer.name}</span>
						<span class="scorer-pts">{scorer.cumulativePts} pts</span>
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ul>

<style>
	.page-header {
		font-weight: 300;
		font-size: 3rem;
		margin: 0.5rem;
		text-align: center;
	}
	.team-rankings {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin: 0;
		padding: 0 2rem 8rem;
		list-style-type: none;
		font-size: 3rem;
	}
	.team-entry {
		border-left: 2rem solid transparent;
		display: flex;
		align-items: center;
		font-weight: 300;
		padding: 1rem 2rem;
		gap: 2rem;
		transform: skewX(-15deg);

		border-left-color: hsl(from var(--team-color) h s 50%);
		background: hsl(from var(--team-color) h s 80%);
		background: linear-gradient(
			to right,
			hsl(from var(--team-color) h s 75%),
			hsl(from var(--team-color) h s 85%)
		);
		color: hsl(from var(--team-color) h s 25%);
		box-shadow:
			0 4px 6px -1px hsl(from var(--team-color) h s 30%),
			0 2px 4px -2px hsl(from var(--team-color) h s 30%);
	}
	.team-logo,
	.team-rank,
	.team-name,
	.team-pts {
		transform: skewX(15deg);
	}
	.team-rank {
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		width: 3rem;
		text-align: center;
	}
	.team-logo {
		max-height: 6rem;
		border-radius: 50%;
	}
	.team-name {
		flex-grow: 1;
	}
	.team-pts {
		font-variant-numeric: tabular-nums;
	}
	.team-breakdown-wrapper {
		z-index: -10;
		margin: 1px 0 4rem;
		display: flex;
		justify-content: center;
	}
	.team-breakdown-inner {
		width: 90%;
		padding: 0;
		list-style: none;
		font-size: 2rem;
	}
	.scorer-entry {
		border-left: 0.5rem solid transparent;
		display: flex;
		align-items: center;
		font-weight: 300;
		gap: 2rem;

		border-top-color: hsl(from var(--team-color) h s 90%);
		border-left-color: hsl(from var(--team-color) h s 50%);
		background: hsl(from var(--team-color) h s 75%);
		background: linear-gradient(
			to right,
			hsl(from var(--team-color) h s 70%),
			hsl(from var(--team-color) h s 80%)
		);
		color: hsl(from var(--team-color) h s 25%);
		box-shadow:
			0 4px 6px -1px hsl(from var(--team-color) h s 30%),
			0 2px 4px -2px hsl(from var(--team-color) h s 30%);
	}
	.scorer-entry:first-child {
		padding-top: 4px;
	}
	.scorer-entry + .scorer-entry {
		border-top: 1px solid transparent;
	}
	.scorer-name {
		flex-grow: 1;
		padding: 0 2rem;
	}
	.scorer-pts {
		padding: 0 2rem;
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 640px) {
		.team-entry,
		.team-logo,
		.team-rank,
		.team-name,
		.team-pts {
			transform: none;
		}
		.page-header {
			font-size: 1.75rem;
		}
		.team-rankings {
			font-size: 1.5rem;
			padding: 0;
		}
		.team-breakdown-inner {
			font-size: 1.25rem;
		}
		.team-entry {
			border-left-width: 8px;
			gap: 0.5rem;
		}
		.team-logo {
			max-height: 3rem;
			border-radius: 0;
		}
		.scorer-entry {
			width: 100%;
			border-left-width: 0.25rem;
		}
	}
</style>
