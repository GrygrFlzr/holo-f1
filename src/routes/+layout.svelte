<script lang="ts">
	import { page } from '$app/state';
	import './fonts.css';
	import './colors.css';

	let { children } = $props();

	const canonicalHref = $derived.by(() => {
		const { url } = page;
		url.protocol = 'https:';
		url.host = 'f1.kfp.yt';
		url.port = '443';
		return url.href;
	});
</script>

<svelte:head>
	<link rel="canonical" href={canonicalHref} />
	<link rel="preconnect" href="https://cdn.discordapp.com" />
</svelte:head>

<div class="wrapper">
	{@render children()}
</div>

<style>
	.wrapper {
		display: contents;
		font-family:
			'Titillium Web', system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
			'Segoe UI Symbol', 'Noto Color Emoji';
	}
</style>
