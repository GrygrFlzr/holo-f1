<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();
</script>

{#if data.user}
	<p>Hello, {data.user.display_name}!</p>
	<form method="post" action={resolve('/auth/logout')}>
		<input type="submit" value="Log out" />
	</form>
{:else}
	<p>Hello!</p>
	<a href={resolve('/auth/discord')}>Log in with Discord</a>
{/if}
