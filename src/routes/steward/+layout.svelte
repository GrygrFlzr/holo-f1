<script lang="ts">
	let { children } = $props();
</script>

{@render children()}

<style>
	:root {
		color-scheme: light dark;
		background-color: light-dark(oklch(87% 0 0), oklch(20.5% 0 0));
	}
</style>
