<script lang="ts">
	import type { PageProps } from './$types';
	import pngLogo from '$lib/assets/logo.png?no-inline';
	let { data }: PageProps = $props();
	const [individuals, teams] = $derived.by(() => {
		let _individuals = $state(data.individuals);
		let _teams = $state(data.teams);
		return [_individuals, _teams];
	});
	const rankEmojis = ['🥇', '🥈', '🥉'];
	const description = $derived(
		individuals
			.filter((person) => person.rank <= 3)
			.map(
				(person) => `${rankEmojis[person.rank - 1]} ${person.name} // ${person.cumulativePoints}`
			)
			.join('\n')
	);
	const teamsByName = $derived(Object.fromEntries(teams.map((team) => [team.name, team])));
	const grandsPrix = [
		'Australian Grand Prix',
		'Chinese Grand Prix',
		'Japanese Grand Prix',
		'Bahrain Grand Prix',
		'Saudi Arabian Grand Prix',
		'Miami Grand Prix',
		'Emilia Romagna Grand Prix',
		'Monaco Grand Prix',
		'Spanish Grand Prix',
		'Canadian Grand Prix',
		'Austrian Grand Prix',
		'British Grand Prix',
		'Belgian Grand Prix',
		'Hungarian Grand Prix',
		'Dutch Grand Prix',
		'Italian Grand Prix',
		'Azerbaijan Grand Prix',
		'Singapore Grand Prix',
		'United States Grand Prix',
		'Mexico City Grand Prix',
		'São Paulo Grand Prix',
		'Las Vegas Grand Prix',
		'Qatar Grand Prix',
		'Abu Dhabi Grand Prix'
	];
</script>

<svelte:head>
	<meta property="og:title" content="Season 3 Individual Standings" />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={pngLogo} />
	<meta property="og:image:width" content="1193" />
	<meta property="og:image:height" content="188" />
	<meta property="twitter:card" content="summary_large_image" />
	<title>Season 3 Individual Standings | Holocord F1 Watchalong Prediction Championship</title>
</svelte:head>

<h2 class="page-header">Season 3 Individual Standings</h2>

<div class="individual-list">
	{#each data.individuals as individual (individual.name)}
		<div class="individual-entry">
			<div class="individual-metadata">
				<span>#{individual.rank}</span>
				<span class="individual-name">{individual.name}</span>
			</div>
			<div class="point-record-list">
				{#each individual.points as pointRecord (pointRecord.round)}
					<div
						class="point-record-entry"
						style="--team-color: {teamsByName[pointRecord.team].color}"
					>
						<div class="point-record-location">{grandsPrix[pointRecord.round - 1]}</div>
						<div class="point-record-team">{pointRecord.team}</div>
						<div class="point-record-score">{pointRecord.roundScore}</div>
					</div>
				{/each}
				<div class="point-record-entry point-record-sum">
					<div class="point-record-location">-</div>
					<div class="point-record-team">TOTAL</div>
					<div class="point-record-score">{individual.cumulativePoints}</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.page-header {
		text-align: center;
	}
	.individual-list {
		display: flex;
		flex-direction: column;
		margin-bottom: 10rem;
	}
	.individual-entry + .individual-entry {
		margin-top: 1rem;
	}
	.individual-metadata {
		border: 1px solid var(--f1-red);
		border-left-width: 0.25rem;
		background: linear-gradient(
			to right,
			hsl(from var(--f1-red) h s 75%),
			hsl(from var(--f1-red) h s 85%)
		);
		color: hsl(from var(--f1-red) h s 25%);
		box-shadow:
			0 4px 6px -1px hsl(from var(--f1-red) h s 30%),
			0 2px 4px -2px hsl(from var(--f1-red) h s 30%);
		display: grid;
		grid-template-columns: 4rem 1fr 4rem;
		font-size: 2rem;
		transform: skewX(-15deg);
		font-weight: 300;
	}
	.individual-metadata > span {
		display: inline-block;
		transform: skewX(15deg);
		padding: 0.25rem 0.5rem;
	}
	.individual-name {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.point-record-list {
		position: relative;
		z-index: -10;
		display: flex;
		flex-direction: column;
		margin: 0 4rem;

		box-shadow:
			0 4px 6px -1px hsl(from black h s 30%),
			0 2px 4px -2px hsl(from black h s 30%);
	}
	.point-record-entry {
		display: grid;
		grid-template-columns: 1fr 1fr 4rem;
		font-size: 1.5rem;
		font-weight: 300;
		border-width: 1px;
		border-style: solid;
		border-top-width: 0;

		background: linear-gradient(
			to right,
			hsl(from var(--team-color) h s 75%),
			hsl(from var(--team-color) h s 85%)
		);
		border-color: hsl(from var(--team-color) h s 30%);
		color: hsl(from var(--team-color) h s 15%);
	}
	.point-record-location,
	.point-record-team,
	.point-record-score {
		padding: 0.5rem 1rem;
	}
	.point-record-score {
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.point-record-sum {
		background-color: hsl(from black h s 30%);
		border-color: hsl(from black h s 10%);
		color: hsl(from black h s 95%);
	}
	@media (max-width: 640px) {
		.individual-metadata,
		.individual-metadata > span {
			transform: none;
		}
		.point-record-list {
			margin: 0 0.5rem;
		}
		.point-record-entry {
			font-size: 0.8rem;
			grid-template-columns: 1fr 1fr 2rem;
		}
	}
</style>
