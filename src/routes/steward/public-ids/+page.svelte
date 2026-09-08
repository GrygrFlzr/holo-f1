<script lang="ts">
	import { resolve } from '$app/paths';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Public IDs</title>
</svelte:head>

<h1>Public IDs</h1>

<p>
	{data.remaining}
	{data.remaining === 1 ? 'user' : 'users'}
	without a public ID.
</p>

{#if form?.assigned !== undefined}
	<p>
		{form.assigned}
		{form.assigned === 1 ? 'public ID was' : 'public IDs were'}
		assigned.
	</p>
{/if}

{#if data.remaining > 0}
	<form method="POST">
		<button type="submit">Assign public IDs</button>
	</form>
{/if}

<p><a href={resolve('/steward')}>Steward</a></p>
