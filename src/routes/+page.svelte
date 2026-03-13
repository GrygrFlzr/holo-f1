<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
	const actual = {
		pole: 'RUS',
		p1: 'RUS',
		p2: 'ANT',
		p3: 'LEC',
		p10: 'GAS',
		dotd: 'VER'
	};
	const teamMap = $derived(new Map(data.teams.map((row) => [row.id, row])));
	const driverMap = $derived(new Map(data.drivers.map((row) => [row.id, row])));
	const sortedSubmissions = $derived(
		data.submissions
			.map((s) => ({
				...s,
				score: [
					actual.pole === driverMap.get(s.pole)!.code,
					actual.p1 === driverMap.get(s.p1)!.code,
					actual.p2 === driverMap.get(s.p2)!.code,
					actual.p3 === driverMap.get(s.p3)!.code,
					actual.p10 === driverMap.get(s.p10)!.code,
					actual.dotd === driverMap.get(s.dotd)!.code
				].reduce((prev, currBool) => prev + (currBool ? 1 : 0), 0)
			}))
			.sort((a, b) => b.score - a.score)
	);
</script>

<svelte:head>
	<title>Holo-F1</title>
	<meta name="description" content="Formula 1 Prediction championship for Holocords" />
</svelte:head>

<main>
	<nav>
		{#if data.user}
			{@const baseSize = 32}
			{@const baseImage = data.user.avatar_hash
				? `https://cdn.discordapp.com/avatars/${data.user.discord_id}/${data.user.avatar_hash}.webp`
				: `https://cdn.discordapp.com/embed/avatars/${(BigInt(data.user.discord_id) >> 22n) % 6n}.png`}
			<img
				class="avatar"
				alt="{data.user.display_name}'s Avatar"
				srcset={[
					[`${baseImage}?size=${baseSize * 1}`, '1x'],
					[`${baseImage}?size=${baseSize * 2}`, '2x'],
					[`${baseImage}?size=${baseSize * 3}`, '3x']
				]
					.map(([url, dpi]) => `${url} ${dpi}`)
					.join(', ')}
				src="{baseImage}?size=${baseSize}"
			/>
			<span class="user-name">{data.user.display_name}</span>
			<span class="filler"></span>
			<form method="post" action={resolve('/auth/logout')}>
				<input class="button" type="submit" value="Log out" />
			</form>
		{:else}
			<a class="discord button" href={resolve('/auth/discord')}>Log in with Discord</a>
		{/if}
	</nav>
	<p>The site is a little more barebones than we'd like, but definitely functional!</p>
	<p>Things you can already do:</p>
	<ul>
		<li>
			<a href={resolve('/submit')}>Submit a prediction for the Chinese GP</a>
		</li>
		<li>
			Check the Season 3 archives:
			<ul>
				<li>
					<a
						data-sveltekit-preload-data="off"
						href={resolve('/season-3/individuals')}
						rel="external">Look at Season 3's Individual Rankings</a
					>
				</li>
				<li>
					<a data-sveltekit-preload-data="off" href={resolve('/season-3/teams')} rel="external"
						>Look at Season 3's Team Rankings</a
					>
				</li>
			</ul>
		</li>
	</ul>
	<p>Things you will (hopefully) be able to do by next week:</p>
	<ul>
		<li>View rankings</li>
		<li>View past predictions</li>
		<li>Not get an eyesore</li>
	</ul>
</main>

<aside>
	<p>
		bold predictions still in scoring but at least you can see the definitely scored prediction
		points
	</p>
	<table>
		<thead>
			<tr>
				<td colspan={3}>Materialized Australia GP Results*</td>
				<td>{actual.pole}</td>
				<td>{actual.p1}</td>
				<td>{actual.p2}</td>
				<td>{actual.p3}</td>
				<td>{actual.p10}</td>
				<td>{actual.dotd}</td>
			</tr>
			<tr>
				<th scope="col">Submitter</th>
				<th scope="col">Team</th>
				<th scope="col">Score</th>
				<th scope="col">Pole</th>
				<th scope="col">P1</th>
				<th scope="col">P2</th>
				<th scope="col">P3</th>
				<th scope="col">P10</th>
				<th scope="col">DotD</th>
			</tr>
		</thead>
		<tbody>
			{#each sortedSubmissions as s (s.username)}
				{@const team = teamMap.get(s.team)!}
				<tr>
					<td>{s.username}</td>
					<td>
						<span style:--team-color={team.color}>{team.name}</span>
					</td>
					<td>{s.score}</td>
					{#snippet driverCell(id: number, actualCode: string)}
						{@const driver = driverMap.get(id)!}
						{#if driver.code === actualCode}
							<td>&check;</td>
						{:else}
							<td>{driver.code}</td>
						{/if}
					{/snippet}
					{@render driverCell(s.pole, actual.pole)}
					{@render driverCell(s.p1, actual.p1)}
					{@render driverCell(s.p2, actual.p2)}
					{@render driverCell(s.p3, actual.p3)}
					{@render driverCell(s.p10, actual.p10)}
					{@render driverCell(s.dotd, actual.dotd)}
				</tr>
			{/each}
		</tbody>
	</table>
</aside>

<style>
	:root {
		color-scheme: light dark;
		background-color: light-dark(oklch(87% 0 0), oklch(20.5% 0 0));
	}
	main {
		max-width: 80ch;
		margin: 2rem auto;
	}
	nav {
		display: flex;
		align-items: center;
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}
	.user-name {
		margin-left: 0.5rem;
	}
	.filler {
		flex-grow: 1;
	}
	.button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: color 0.1s linear;
		text-decoration: none;
	}
	.discord {
		background-color: var(--discord-blurple);
		color: var(--discord-light-blurple);
	}
	.discord.button:hover {
		background-color: oklch(from var(--discord-blurple) l c h / 90%);
	}
</style>
