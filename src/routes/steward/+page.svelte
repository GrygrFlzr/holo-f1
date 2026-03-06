<script lang="ts">
	const { data } = $props();
</script>

<svelte:head>
	<title>Dashboard | Holo-F1</title>
</svelte:head>

<main>
	<h1>Steward Dashboard</h1>

	{#if !data.weekend}
		<p>No unscored weekends</p>
	{:else}
		<h2>{data.weekend.name}</h2>
		{#if data.locked}
			<p>Locked - {data.entries.length} entries</p>
		{:else}
			<p>Open - {data.entries.length} submitted so far</p>
		{/if}

		{#if data.entries.length === 0}
			<p>No submissions yet.</p>
		{:else if data.locked}
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Pole</th>
						<th>P1</th>
						<th>P2</th>
						<th>P3</th>
						<th>P10</th>
						<th>DotD</th>
						<th>Team</th>
					</tr>
				</thead>
				<tbody>
					{#each data.entries as entry (entry.discord_id)}
						<tr>
							<td>{entry.discord_name}</td>
							<td>{entry.pole_code}</td>
							<td>{entry.p1_code}</td>
							<td>{entry.p2_code}</td>
							<td>{entry.p3_code}</td>
							<td>{entry.p10_code}</td>
							<td>{entry.dotd_code}</td>
							<td>{entry.team_name}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<ul>
				{#each data.entries as entry (entry.discord_id)}
					<li>{entry.discord_name}</li>
				{/each}
			</ul>
		{/if}
	{/if}
</main>

<style>
	main {
		width: 90%;
		margin: 10px auto;
	}
	table {
		table-layout: fixed;
		border-collapse: collapse;
		width: 100%;
	}

	th,
	td {
		padding: 0.125rem;
		text-align: center;
	}

	tbody tr:nth-child(odd) {
		background-color: light-dark(hsl(0, 0%, 93%), hsl(0, 0%, 7%));
	}
</style>
