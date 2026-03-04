<script lang="ts">
	import { SvelteDate } from 'svelte/reactivity';

	let { lockTime }: { lockTime: string } = $props();

	let now = new SvelteDate();
	let mounted = $state.raw(false);

	const deadline = $derived(new Date(lockTime).getTime());

	$effect(() => {
		mounted = true;
		const interval = setInterval(() => {
			now.setTime(Date.now());
		}, 60_000);
		return () => clearInterval(interval);
	});

	const remaining = $derived(deadline - now.getTime());
	const locked = $derived(remaining <= 0);

	const localString = $derived(
		mounted
			? new Date(lockTime).toLocaleString(undefined, {
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
		const minutes = Math.floor(remaining / 60_000);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) return `${days}d ${hours % 24}h remaining`;
		if (hours > 0) return `${hours}h ${minutes % 60}m remaining`;
		return `${minutes}m remaining`;
	});
</script>

<time datetime={lockTime}>
	{localString}
	{#if mounted}
		<span>({relativeString})</span>
	{/if}
</time>
