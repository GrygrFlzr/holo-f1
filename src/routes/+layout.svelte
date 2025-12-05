<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { page } from '$app/state';
	import '$lib/colors.css';
	let { children } = $props();

	const canonicalUrl = page.url;
	canonicalUrl.protocol = 'https:';
	canonicalUrl.host = 'f1.kfp.yt';
	canonicalUrl.port = '443';
</script>

<svelte:head>
	<link rel="canonical" href={canonicalUrl.href} />
</svelte:head>

<div class="everything">
	<header class="header-container">
		<img
			class="header-logo"
			src={asset('/logo.webp')}
			alt="Holocord F1 Watchalongs Prediction Championship"
		/>
	</header>
	<nav class="nav-list">
		<a class="nav-item" href={resolve('/season-3/teams')}>Team Standings</a>
		<a class="nav-item" href={resolve('/season-3/individuals')}>Individual Standings</a>
		<a class="nav-item" href={resolve('/season-3/submit')}>Prediction Form</a>
	</nav>

	<div class="main-content">
		{@render children()}
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		min-height: 100vh;
		background-color: var(--f1-white);
	}
	.everything {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.header-container {
		display: flex;
		justify-content: center;
		align-items: center;
		background: hsl(240, 13%, 9%);
		color: var(--f1-white);
		gap: 0.5rem;
	}
	.header-logo {
		height: 6rem;
		padding: 2rem;
	}
	.nav-list {
		width: 100vw;
		max-width: 840px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.5rem;
	}
	.nav-item {
		display: block;
		background-color: hsl(from var(--f1-black) h s 10%);
		color: hsl(from var(--f1-black) h s 90%);
		text-decoration: none;
		text-align: center;
		font-size: 1.5rem;
		border-radius: 0 0 0.25rem 0.25rem;
		padding: 0.5rem;
		font-weight: 400;
		box-shadow:
			0 4px 6px -1px hsl(from black h s 30%),
			0 2px 4px -2px hsl(from black h s 30%);
		border-bottom: 4px solid transparent;
	}
	.nav-item:hover {
		background-color: hsl(from var(--f1-red) h s 20%);
	}
	.main-content {
		flex-grow: 1;
		margin: 0 auto;
		width: 100vw;
		max-width: 840px;
		color: var(--f1-black);
	}
	@media (max-width: 640px) {
		.header-container > :global(svg) {
			height: 3rem;
			padding: 0.5rem;
		}
		.nav-list {
			width: 90vw;
			grid-template-columns: 1fr;
			gap: 8px;
			padding: 8px 0;
		}
		.nav-item {
			border-radius: 0.5rem;
		}
	}
</style>
