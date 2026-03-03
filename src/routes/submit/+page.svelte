<script lang="ts">
	import { enhance } from '$app/forms';
	import LockTime from './LockTime.svelte';

	let { data, form } = $props();
	const { weekend, drivers, teams, submission, user } = $derived(data);
	const permanentDrivers = $derived(drivers.filter((d) => d.category === 'permanent'));
	const reserveDrivers = $derived(drivers.filter((d) => d.category === 'reserve'));
</script>

<svelte:head>
	<title>{weekend ? `Submit — ${weekend.name}` : 'Submit'} | Holo-F1</title>
</svelte:head>

{#if !weekend}
	<h1>No Open Weekend</h1>
	<p>There's no upcoming weekend accepting submissions right now.</p>
{:else}
	<h1>{weekend.name}</h1>
	<p>Submissions lock at <LockTime lockTime={weekend.lock_time} /></p>

	{#if weekend.watchalong_host}
		<p>Watchalong hosted by <strong>{weekend.watchalong_host}</strong></p>
	{/if}

	{#if !user}
		<p>Log in with Discord to submit your predictions.</p>
	{:else if form?.error}
		<output role="alert">{form.error}</output>
	{:else if form?.success}
		<output>Predictions saved!</output>
	{:else if form?.cleared}
		<output>Predictions cleared.</output>
	{/if}

	{@render predictionForm(!user)}
{/if}

{#snippet predictionForm(disabled: boolean)}
	<fieldset {disabled} class="semantic-group">
		<form
			method="POST"
			action="?/save"
			use:enhance={() => {
				return async ({ update }) => {
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="weekend_id" value={weekend.id} />
			<fieldset>
				<legend>Driver Predictions</legend>
				{@render driverSelect('pole_driver_id', 'Pole Position', submission?.pole_driver_id)}
				{@render driverSelect('p1_driver_id', 'P1 (Winner)', submission?.p1_driver_id)}
				{@render driverSelect('p2_driver_id', 'P2', submission?.p2_driver_id)}
				{@render driverSelect('p3_driver_id', 'P3', submission?.p3_driver_id)}
				{@render driverSelect('p10_driver_id', 'P10', submission?.p10_driver_id)}
				{@render driverSelect('dotd_driver_id', 'Driver of the Day', submission?.dotd_driver_id)}
			</fieldset>

			<fieldset>
				<legend>Team & Bold Prediction</legend>
				<div>
					<label for="team_id">Your Team</label>
					<select id="team_id" name="team_id" required>
						<option value="" disabled selected={!submission?.team_id}>Select a team…</option>
						{#each teams as team}
							<option value={team.id} selected={submission?.team_id === team.id}>
								{team.oshi_mark ? `${team.oshi_mark} ` : ''}{team.name}
							</option>
						{/each}
					</select>
				</div>

				<div>
					<label for="bold_prediction">Bold Prediction (optional)</label>
					<textarea
						id="bold_prediction"
						name="bold_prediction"
						rows="2"
						placeholder="e.g. Safety car in the first 5 laps"
						>{submission?.bold_prediction ?? ''}</textarea
					>
				</div>
			</fieldset>

			<div class="form-actions">
				<button type="submit" class="btn-primary">Save Predictions</button>
			</div>
		</form>

		<form method="POST" action="?/clear" use:enhance>
			<input type="hidden" name="weekend_id" value={weekend.id} />
			<button type="submit" class="btn-danger-subtle">Delete Submission</button>
		</form>
	</fieldset>
{/snippet}

{#snippet driverSelect(name: string, label: string, selectedId: number | null | undefined)}
	<div>
		<label for={name}>{label}</label>
		<select id={name} {name} required>
			<option value="" disabled selected={!selectedId}>Select a driver…</option>
			<optgroup label="Drivers">
				{#each permanentDrivers as driver}
					<option value={driver.id} selected={selectedId === driver.id}>
						{driver.code} — {driver.name}
					</option>
				{/each}
			</optgroup>
			<optgroup label="Reserves">
				{#each reserveDrivers as driver}
					<option value={driver.id} selected={selectedId === driver.id}>
						{driver.code} — {driver.name}
					</option>
				{/each}
			</optgroup>
		</select>
	</div>
{/snippet}

<style>
	.semantic-group {
		border: none;
		padding: 0;
		margin: 0;
	}
	.btn-primary {
		/* background: var(--color-accent); */
		/* color: white; */
		padding: 0.5rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-danger-subtle {
		background: none;
		border: none;
		/* color: var(--color-muted); */
		cursor: pointer;
		font-size: 0.875rem;
		text-decoration: underline;
		padding: 0.5rem 0;
		margin-top: 0.5rem;
	}

	.btn-danger-subtle:hover {
		/* color: var(--color-danger); */
	}
</style>
