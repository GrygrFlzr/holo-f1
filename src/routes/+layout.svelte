<script lang="ts">
	import { page } from '$app/state';
	import './colors.css';
	let { children } = $props();

	const canonicalUrl = page.url;
	canonicalUrl.protocol = 'https:';
	canonicalUrl.host = 'f1.kfp.yt';
	canonicalUrl.port = '443';
</script>

<svelte:head>
	<link rel="canonical" href={canonicalUrl.href} />
</svelte:head>

{@render children()}
