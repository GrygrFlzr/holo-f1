<script lang="ts">
	import { browser } from '$app/environment';
	import { parseDateTime } from '$lib/time';
	import { SvelteDate } from 'svelte/reactivity';

	let { lockTime }: { lockTime: string } = $props();

	const now = new SvelteDate();
	let visibilityState: DocumentVisibilityState = $state('visible');

	const parsedLockTime = $derived(parseDateTime(lockTime));
	const remaining = $derived.by(() => {
		if (parsedLockTime) {
			const deadline = parsedLockTime.getTime();
			if (!isNaN(deadline)) {
				return deadline - now.getTime();
			}
		}
		return null;
	});
	const locked = $derived(remaining ? remaining <= 0 : false);

	const localString = $derived(
		browser && parsedLockTime
			? parsedLockTime.toLocaleString(undefined, {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit',
					timeZoneName: 'short',
					hour12: false
				})
			: lockTime
	);

	const relativeString = $derived.by(() => {
		if (locked) return 'Submissions locked';
		if (!remaining) return 'Invalid date for weekend';
		const minutes = Math.floor(remaining / 60_000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h remaining`;
		if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
		return `${minutes}m remaining`;
	});

	$effect(() => {
		if (visibilityState !== 'visible') return;
		now.setTime(Date.now());
		const interval = setInterval(() => now.setTime(Date.now()), 60_000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:document bind:visibilityState />

<time datetime={lockTime}>
	{localString}
	{#if browser}
		<span>({relativeString})</span>
	{/if}
</time>
