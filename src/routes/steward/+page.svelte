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
						<th scope="col"></th>
						<th scope="col">Name</th>
						<th scope="col">Pole</th>
						<th scope="col">P1</th>
						<th scope="col">P2</th>
						<th scope="col">P3</th>
						<th scope="col">P10</th>
						<th scope="col">DotD</th>
						<th scope="col">Team</th>
					</tr>
				</thead>
				<tbody>
					{#each data.entries as entry (entry.discord_id)}
						{@const baseSize = 32}
						{@const baseImage = `https://cdn.discordapp.com/avatars/${entry.discord_id}/${
							entry.avatar_hash
						}.webp`}
						<tr>
							<td>
								<img
									class="avatar"
									alt="{entry.discord_name}'s Avatar"
									srcset={[
										[`${baseImage}?size=${baseSize * 1}`, '1x'],
										[`${baseImage}?size=${baseSize * 2}`, '2x'],
										[`${baseImage}?size=${baseSize * 3}`, '3x']
									]
										.map(([url, dpi]) => `${url} ${dpi}`)
										.join(', ')}
									src="{baseImage}?size=${baseSize}"
								/>
							</td>
							<td>{entry.discord_name}</td>
							<td>{entry.pole_code}</td>
							<td>{entry.p1_code}</td>
							<td>{entry.p2_code}</td>
							<td>{entry.p3_code}</td>
							<td>{entry.p10_code}</td>
							<td>{entry.dotd_code}</td>
							<td style="--team-color: {entry.team_color};">
								<span class="team-name">{entry.team_name}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<table>
				<thead>
					<tr>
						<th scope="col" class="col-avatar"></th>
						<th scope="col">Name</th>
						<th scope="col">Team</th>
					</tr>
				</thead>
				<tbody>
					{#each data.entries as entry (entry.discord_id)}
						{@const baseSize = 32}
						{@const baseImage = `https://cdn.discordapp.com/avatars/${entry.discord_id}/${
							entry.avatar_hash
						}.webp`}
						<tr>
							<td class="col-avatar">
								<img
									class="avatar"
									alt="{entry.discord_name}'s Avatar"
									srcset={[
										[`${baseImage}?size=${baseSize * 1}`, '1x'],
										[`${baseImage}?size=${baseSize * 2}`, '2x'],
										[`${baseImage}?size=${baseSize * 3}`, '3x']
									]
										.map(([url, dpi]) => `${url} ${dpi}`)
										.join(', ')}
									src="{baseImage}?size=${baseSize}"
								/>
							</td>
							<td>{entry.discord_name}</td>
							<td style="--team-color: {entry.team_color};">
								<span class="team-name">{entry.team_name}</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
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
	.avatar {
		border-radius: 50%;
		width: 32px;
		height: 32px;
		text-align: center;
	}
	.col-avatar {
		width: 32px;
	}
	.team-name {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--team-color);
		border-radius: 4px;
	}
	.team-name::before {
		content: '';
		border-radius: 50%;
		height: 1rem;
		width: 1rem;
		background-color: var(--team-color);
		margin-right: 0.25rem;
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
