<script lang="ts">
	import { page } from '$app/state';
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
</svelte:head>

{@render children()}
