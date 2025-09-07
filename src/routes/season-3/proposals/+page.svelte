<script lang="ts">
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();

	let ayaviProposal = data.teams
		.map((team) => {
			let grandsPrix = data.grandsPrix.slice(0, 4).map((gpName, gpIndex) => {
				const gpNum = gpIndex + 1;
				const records = data.scores
					.filter((record) => record.round === gpNum && record.team === team.name)
					.sort((a, b) => b.score - a.score)
					.slice(0, 3);
				return {
					round: gpNum,
					name: gpName,
					records: records,
					score: records.map((rec) => rec.score).reduce((a, b) => a + b, 0)
				};
			});
			return {
				name: team.name,
				grandsPrix,
				totalScore: grandsPrix.map((gp) => gp.score).reduce((a, b) => a + b, 0)
			};
		})
		.sort((a, b) => b.totalScore - a.totalScore);
	let dakkyunProposal = data.teams
		.map((team) => {
			let grandsPrix = data.grandsPrix.slice(0, 4).map((gpName, gpIndex) => {
				const gpNum = gpIndex + 1;
				const records = data.scores
					.filter((record) => record.round === gpNum && record.team === team.name)
					.sort((a, b) => b.score - a.score);
				return {
					round: gpNum,
					name: gpName,
					records: records,
					score:
						records.length === 0
							? 0
							: records.map((rec) => rec.score).reduce((a, b) => a + b, 0) / records.length
				};
			});
			return {
				name: team.name,
				grandsPrix,
				totalScore: grandsPrix.map((gp) => gp.score).reduce((a, b) => a + b, 0)
			};
		})
		.sort((a, b) => b.totalScore - a.totalScore);

	let weightFactor = $state(0.95);

	const grygrProposal = $derived(
		data.teams
			.map((team) => {
				let grandsPrix = data.grandsPrix.slice(0, 4).map((gpName, gpIndex) => {
					const gpNum = gpIndex + 1;
					const records = data.scores
						.filter((record) => record.round === gpNum && record.team === team.name)
						.sort((a, b) => b.score - a.score);
					return {
						round: gpNum,
						name: gpName,
						records: records,
						score: records
							.map((rec) => rec.score)
							.reduce((total, curr, index) => total + curr * Math.pow(weightFactor, index), 0)
					};
				});
				return {
					name: team.name,
					grandsPrix,
					totalScore: grandsPrix.map((gp) => gp.score).reduce((a, b) => a + b, 0)
				};
			})
			.sort((a, b) => b.totalScore - a.totalScore)
	);
</script>

<svelte:head>
	<meta property="og:title" content="Team Scoring Proposals" />
	<meta property="og:description" content="Previews of three separate proposals to team scoring" />
	<title>Season 3 Team Scoring Proposals</title>
</svelte:head>

<h2>Ayavi's Proposal (adjusted): Count Top 3 individuals per round</h2>
<p>Per Grand Prix, only the top 3 scores count</p>
<div class="team-list">
	{#each ayaviProposal.slice(0, 4) as team (team.name)}
		<div
			class="team-entry"
			style="
            --color: {data.teams.find((_team) => _team.name === team.name)?.color || 'red'};
        "
		>
			<h4>{team.name} ({team.totalScore})</h4>
			<div>
				{#each team.grandsPrix as gp (gp.round)}
					<h4 class="gp-name">{gp.name} ({gp.score})</h4>
					<ol>
						{#each gp.records as record (record.name)}
							<li>{record.name} ({record.score})</li>
						{/each}
					</ol>
				{/each}
			</div>
		</div>
	{/each}
</div>

<h2>Dakkyun's Proposal: Average per Round</h2>
<p>Per Grand Prix, all scores are averaged</p>
<p>As seen below, this yields some funny results for solo teams.</p>
<div class="team-list">
	{#each dakkyunProposal.slice(0, 4) as team (team.name)}
		<div
			class="team-entry"
			style="
        --color: {data.teams.find((_team) => _team.name === team.name)?.color || 'red'};
        "
		>
			<h4>{team.name} ({team.totalScore})</h4>
			<div>
				{#each team.grandsPrix as gp (gp.round)}
					<h4 class="gp-name">{gp.name} ({gp.score})</h4>
					<ol>
						{#each gp.records as record (record.name)}
							<li>{record.name} ({record.score})</li>
						{/each}
					</ol>
				{/each}
			</div>
		</div>
	{/each}
</div>

<h2>Grygr's Proposal: Diminishing Returns</h2>
<label>
	Weighting Factor:
	<input type="number" min="0" max="1" step="0.05" bind:value={weightFactor} />
</label>
{#if weightFactor === 0}
	<span class="warning">A weight factor of 0 practically only counts the top result.</span>
{:else if weightFactor === 1}
	<span class="warning">A weight factor of 1 practically counts all results without weighting.</span
	>
{/if}
<p>
	Per Grand Prix, 1st score is worth 100%, 2nd is worth {Math.floor(weightFactor * 100 * 100) /
		100}%, 3rd is worth {Math.floor(weightFactor * weightFactor * 100 * 100) / 100}%, ...
</p>
<div class="team-list">
	{#each grygrProposal.slice(0, 4) as team (team.name)}
		<div
			class="team-entry"
			style="
            --color: {data.teams.find((_team) => _team.name === team.name)?.color || 'red'};
        "
		>
			<h4>{team.name} ({Math.floor(team.totalScore * 100) / 100})</h4>
			<div>
				{#each team.grandsPrix as gp (gp.round)}
					<h4 class="gp-name">{gp.name} ({Math.floor(gp.score * 100) / 100})</h4>
					<ol>
						{#each gp.records as record, recordIndex (record.name)}
							<li>
								{record.name} ({record.score} &times; {weightFactor}<sup>{recordIndex}</sup>
								&equals; {Math.floor(
									record.score * Math.pow(weightFactor, recordIndex) * Math.pow(10, 8)
								) / Math.pow(10, 8)})
							</li>
						{/each}
					</ol>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.team-list {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
	}
	.team-entry {
		background: hsl(from var(--color) h s 80%);
		color: hsl(from var(--color) h s 20%);
	}
	ol {
		padding-left: 1rem;
	}
	.warning {
		color: red;
	}
</style>
