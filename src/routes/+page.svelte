<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Holo-F1</title>
	<meta name="description" content="Formula 1 Prediction championship for Holocords" />
</svelte:head>

<main>
	{#if data.user}
		<p>Hello, {data.user.display_name}!</p>
		<form method="post" action={resolve('/auth/logout')}>
			<input type="submit" value="Log out" />
		</form>
	{:else}
		<p>Hello!</p>
		<p><a class="discord button" href={resolve('/auth/discord')}>Log in with Discord</a></p>
	{/if}
	<p>The site is a little more barebones than we'd like, but definitely functional!</p>
	<p>Things you can already do:</p>
	<ul>
		<li>
			<a href={resolve('/submit')}>Submit a prediction for the Australian GP</a>
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
		<li>Not get an eyesore</li>
	</ul>
</main>

<style>
	:root {
		color-scheme: light dark;
		background-color: light-dark(oklch(87% 0 0), oklch(20.5% 0 0));
	}
	main {
		max-width: 80ch;
		margin: 2rem auto;
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
