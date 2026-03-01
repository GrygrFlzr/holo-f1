<script lang="ts">
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

{#if data.user}
	<p>Hello, {data.user.display_name}!</p>
{:else}
	<p>Hello!</p>
{/if}
