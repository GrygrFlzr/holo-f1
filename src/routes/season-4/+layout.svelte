<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import './standings.css';

	let { children } = $props();

	const individualsHref = resolve('/season-4/individuals');
	const teamsHref = resolve('/season-4/teams');
</script>

<div class="season-shell">
	<header class="season-header">
		<a class="season-title" href={individualsHref}> Season 4 </a>

		<nav class="season-nav" aria-label="Season 4 standings">
			<a
				href={individualsHref}
				aria-current={page.url.pathname === individualsHref ? 'page' : undefined}
			>
				Individuals
			</a>

			<a href={teamsHref} aria-current={page.url.pathname === teamsHref ? 'page' : undefined}>
				Teams
			</a>
		</nav>
	</header>

	{@render children()}
</div>
