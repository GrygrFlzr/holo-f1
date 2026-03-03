<script lang="ts">
	import type { Driver } from '$lib/server/db/drivers';

	const {
		name,
		label,
		selectedId,
		drivers
	}: {
		name: string;
		label: string;
		selectedId?: number | null;
		drivers: Driver[];
	} = $props();
	const id = $props.id();

	const permanentDrivers = $derived(drivers.filter((d) => d.category === 'permanent'));
	const reserveDrivers = $derived(drivers.filter((d) => d.category === 'reserve'));
</script>

<div>
	<label for={id}>{label}</label>
	<select {id} {name} required>
		<option value="" disabled selected={!selectedId}>Select a driver…</option>
		<optgroup label="Drivers">
			{#each permanentDrivers as driver (driver.id)}
				<option value={driver.id} selected={selectedId === driver.id}>
					{driver.code} — {driver.name}
				</option>
			{/each}
		</optgroup>
		<optgroup label="Reserves">
			{#each reserveDrivers as driver (driver.id)}
				<option value={driver.id} selected={selectedId === driver.id}>
					{driver.code} — {driver.name}
				</option>
			{/each}
		</optgroup>
	</select>
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		row-gap: 0.25rem;
	}
</style>
