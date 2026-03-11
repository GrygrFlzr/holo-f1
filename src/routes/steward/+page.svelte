<script lang="ts">
	import { parseDateTime } from '$lib/time.js';

	type UnitValueTuple = [value: number, unit: string, divisor: number];

	const { data } = $props();
	const parsedLockTime = $derived.by(() => {
		if (!data.weekend) return null;
		return parseDateTime(data.weekend.lock_time);
	});

	function computeWeekendTimeDelta(submitTime: string) {
		if (!parsedLockTime) return null;
		const parsedSubmitTime = parseDateTime(submitTime);
		if (!parsedSubmitTime) return null;
		const delta = parsedLockTime.getTime() - parsedSubmitTime.getTime();
		const isValid = delta > 0;
		const deltaMs = Math.abs(delta);
		const deltaSeconds = deltaMs / 1_000;
		const deltaMinutes = deltaSeconds / 60;
		const deltaHours = deltaMinutes / 60;
		const deltaDays = deltaHours / 24;

		// display the two largest units
		const relativeTimeString = (
			[
				// [value, unit, mod]
				[deltaDays, 'day', Infinity],
				[deltaHours, 'hour', 24],
				[deltaMinutes, 'minute', 60],
				[deltaSeconds, 'second', 60]
			] as UnitValueTuple[]
		)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			.filter(([value, _, mod]) => {
				const modValue = Math.floor(value) % mod;
				return modValue > 0;
			})
			.map(([value, unit, mod]) => {
				const modValue = Math.floor(value) % mod;
				const formattedUnit = modValue === 1 ? unit : `${unit}s`;
				return `${modValue} ${formattedUnit}`;
			})
			.slice(0, 2)
			.join(' and ');

		return isValid ? `${relativeTimeString} before lock` : `${relativeTimeString} overdue`;
	}
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
		{:else}
			<table>
				<thead>
					<tr>
						<th scope="col"></th>
						<th scope="col">Name</th>
						<th scope="col">Submitted</th>
						{#if data.locked}
							<th scope="col">Pole</th>
							<th scope="col">P1</th>
							<th scope="col">P2</th>
							<th scope="col">P3</th>
							<th scope="col">P10</th>
							<th scope="col">DotD</th>
						{/if}
						<th scope="col">Team</th>
					</tr>
				</thead>
				<tbody>
					{#each data.entries as entry (entry.discord_id)}
						{@const submitTimeDelta = computeWeekendTimeDelta(entry.updated_at)}
						{@const baseSize = 32}
						{@const baseImage = entry.avatar_hash
							? `https://cdn.discordapp.com/avatars/${entry.discord_id}/${entry.avatar_hash}.webp`
							: `https://cdn.discordapp.com/embed/avatars/${(BigInt(entry.discord_id) >> 22n) % 6n}.png`}
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
							<td>{submitTimeDelta ? submitTimeDelta : 'Unable to parse time'}</td>
							{#if data.locked}
								<td>{entry.pole_code}</td>
								<td>{entry.p1_code}</td>
								<td>{entry.p2_code}</td>
								<td>{entry.p3_code}</td>
								<td>{entry.p10_code}</td>
								<td>{entry.dotd_code}</td>
							{/if}
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
