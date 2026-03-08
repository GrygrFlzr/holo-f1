<script lang="ts">
	import { page } from '$app/state';
	import './fonts.css';
	import './colors.css';

	let { children } = $props();

	const canonicalUrl = $derived.by(() => {
		let { url } = page;
		url.protocol = 'https:';
		url.host = 'f1.kfp.yt';
		url.port = '443';
		return url;
	});
</script>

<svelte:head>
	<link rel="canonical" href={canonicalUrl.href} />
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
