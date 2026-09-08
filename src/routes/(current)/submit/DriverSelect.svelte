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

<div class="driver-field">
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
	.driver-field {
		display: flex;
		flex: 1 1 14rem;
		flex-direction: column;
		gap: var(--space-2);
		min-width: min(100%, 14rem);
	}

	label {
		font-weight: 700;
	}

	select {
		width: 100%;
		min-height: 2.75rem;
		padding-inline: var(--space-3);
		border: 1px solid var(--rule);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	select:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
</style>
