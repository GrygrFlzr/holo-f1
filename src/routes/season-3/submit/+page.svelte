<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import ogImage from '$lib/assets/abudhabi.png?no-inline';

	/* Race constants */
	const raceCount = 24;
	const raceName = 'Abu Dhabi';
	const startTime = new Date('2025-12-06T14:00:00.000Z');
	const raceFormId = '1FAIpQLSfgFaJc9z-XvuR-OSD0pobjI3rSTELPArKoHvCgcQfh5hu2Rw';
	const raceFormUrl = `https://docs.google.com/forms/d/e/${raceFormId}/viewform?embedded=true`;
	const currentTime = new SvelteDate();
	const durationMs = $derived(startTime.getTime() - currentTime.getTime());

	const daysRemaining = $derived(Math.floor(durationMs / 1000 / 60 / 60 / 24));
	const hoursRemaining = $derived(Math.floor(durationMs / 1000 / 60 / 60));
	const minutesRemaining = $derived(Math.floor(durationMs / 1000 / 60));
	const isFormAvailable = $derived(durationMs > 0);

	const formattedDuration: string = $derived.by(() => {
		if (daysRemaining > 1) {
			return `${daysRemaining} days`;
		} else if (hoursRemaining > 1) {
			return `${hoursRemaining} hours`;
		} else if (minutesRemaining > 1) {
			return `${minutesRemaining} minutes`;
		}
		return `a minute`;
	});

	onMount(() => {
		const interval = setInterval(() => {
			currentTime.setTime(Date.now());
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<meta property="og:title" content="Season 3 Race {raceCount} Prediction Form" />
	<title
		>Season 3 Race {raceCount} Prediction Form | Holocord F1 Watchalong Prediction Championship</title
	>
	<meta property="og:description" content="Submit predictions for {raceName}" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="240" />
	<meta property="og:image:height" content="180" />
	<meta property="twitter:card" content="summary" />
</svelte:head>

<div class="container">
	<h2>Race {raceCount}: {raceName}</h2>
	{#if isFormAvailable}
		<p>
			The deadline for submissions is in {formattedDuration}.
		</p>
		<iframe
			sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-forms"
			title="Season 3 Race {raceCount} Form Submission"
			src={raceFormUrl}
		>
			Loading…
		</iframe>
	{:else}
		<p>Form submission is closed as the sprint/race has started.</p>
	{/if}
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: calc(100dvh);
	}
	iframe {
		flex-grow: 1;
		width: 100%;
		border: none;
		margin: 0;
	}
</style>
