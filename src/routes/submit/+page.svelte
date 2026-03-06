<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import DriverSelect from './DriverSelect.svelte';
	import LockTime from './LockTime.svelte';

	let { data, form } = $props();
	const { weekend, drivers, teams, submission, user } = $derived(data);
	const id = $props.id();
</script>

<svelte:head>
	<title>{weekend ? `Submit — ${weekend.name}` : 'Submissions Closed'} | Holo-F1</title>
	<meta name="description" content="Submit Predictions for a Formula 1 Weekend" />
</svelte:head>

<main>
	{#if !weekend}
		<h1>No Open Weekend</h1>
		<p>There's no upcoming weekend accepting submissions right now.</p>
	{:else}
		<h1>{weekend.name}</h1>
		<p>Submissions lock at <LockTime lockTime={weekend.lock_time} /></p>

		{#if weekend.watchalong_host}
			<p>
				This weekend's watchalong is hosted by <strong>{weekend.watchalong_host}</strong>
			</p>
		{/if}

		<nav>
			{#if !user}
				<p>
					<a class="discord button" href={resolve('/auth/discord')}>Log in with Discord</a> to submit
					your predictions.
				</p>
			{:else}
				{@const baseSize = 32}
				{@const baseImage = user.avatar_hash
					? `https://cdn.discordapp.com/avatars/${user.discord_id}/${user.avatar_hash}.webp`
					: `https://cdn.discordapp.com/embed/avatars/${(BigInt(user.discord_id) >> 22n) % 6n}.png`}
				<img
					class="avatar"
					alt="{user.display_name}'s Avatar"
					srcset={[
						[`${baseImage}?size=${baseSize * 1}`, '1x'],
						[`${baseImage}?size=${baseSize * 2}`, '2x'],
						[`${baseImage}?size=${baseSize * 3}`, '3x']
					]
						.map(([url, dpi]) => `${url} ${dpi}`)
						.join(', ')}
					src="{baseImage}?size=${baseSize}"
				/>
				<span class="user-name">{user.display_name}</span>
				<span class="filler"></span>
				<form method="post" action={resolve('/auth/logout')}>
					<input class="button" type="submit" value="Log out" />
				</form>
				{#if form?.error}
					<p><output role="alert" form="save-{id}">{form.error}</output></p>
				{:else if form?.success}
					<p><output form="save-{id}">Predictions saved!</output></p>
				{:else if form?.cleared}
					<p><output form="clear-{id}">Predictions cleared.</output></p>
				{/if}
			{/if}
		</nav>

		{@render predictionForm(!user)}
	{/if}
</main>

{#snippet predictionForm(disabled: boolean)}
	<fieldset {disabled} class="semantic-group">
		<form
			id="save-{id}"
			method="POST"
			action="?/save"
			autocomplete="off"
			use:enhance={() => {
				return async ({ update }) => {
					await update({ reset: false });
				};
			}}
		>
			<input type="hidden" name="weekend_id" value={weekend.id} />
			<fieldset class="inner-fieldset">
				<legend>Driver Predictions</legend>
				<DriverSelect
					name="pole_driver_id"
					label="Pole Position"
					selectedId={submission?.pole_driver_id}
					{drivers}
				/>
				<DriverSelect
					name="p1_driver_id"
					label="P1 (Winner)"
					selectedId={submission?.p1_driver_id}
					{drivers}
				/>
				<DriverSelect
					name="p2_driver_id"
					label="P2"
					selectedId={submission?.p2_driver_id}
					{drivers}
				/>
				<DriverSelect
					name="p3_driver_id"
					label="P3"
					selectedId={submission?.p3_driver_id}
					{drivers}
				/>
				<DriverSelect
					name="p10_driver_id"
					label="P10"
					selectedId={submission?.p10_driver_id}
					{drivers}
				/>
				<DriverSelect
					name="dotd_driver_id"
					label="Driver of the Day"
					selectedId={submission?.dotd_driver_id}
					{drivers}
				/>
			</fieldset>

			<fieldset class="inner-fieldset">
				<legend>Team & Bold Prediction</legend>
				<div class="fieldset-items">
					<label for="team_id">Team for this Weekend</label>
					<select id="team_id" name="team_id" required>
						<option value="" disabled selected={!submission?.team_id}>Select a team…</option>
						{#each teams as team (team.id)}
							<option value={team.id} selected={submission?.team_id === team.id}>
								{team.name}
								{team.oshi_mark ?? ''}
							</option>
						{/each}
					</select>
				</div>

				<div class="fieldset-items">
					<label for="bold_prediction">Bold Prediction (optional)</label>
					<textarea
						id="bold_prediction"
						name="bold_prediction"
						rows="3"
						placeholder="e.g. Safety car in the first 5 laps"
						>{submission?.bold_prediction ?? ''}</textarea
					>
				</div>
			</fieldset>

			<div class="form-actions">
				<button type="submit" class="btn-primary">Save Predictions</button>
				<p>You can update your prediction any time before Qualifying starts.</p>
			</div>
		</form>

		<form id="clear-{id}" method="POST" action="?/clear" use:enhance>
			<input type="hidden" name="weekend_id" value={weekend.id} />
			<button type="submit" class="btn-danger-subtle">Delete Submission</button>
		</form>
	</fieldset>
{/snippet}

<style>
	:root {
		color-scheme: light dark;
		background-color: light-dark(oklch(87% 0 0), oklch(20.5% 0 0));
	}

	main {
		max-width: 80ch;
		margin: 0 auto;
	}
	nav {
		display: flex;
		align-items: center;
	}
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}
	.user-name {
		margin-left: 0.5rem;
	}
	.filler {
		flex-grow: 1;
	}
	.button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		transition: color 0.1s linear;
		text-decoration: none;
	}
	.discord {
		background-color: var(--discord-blurple);
		color: var(--discord-light-blurple);
	}
	.discord.button:hover {
		background-color: oklch(from var(--discord-blurple) l c h / 90%);
	}

	.semantic-group {
		border: none;
		padding: 0;
		margin: 0 auto;
	}

	.fieldset-items select,
	.fieldset-items textarea {
		padding: 0.25rem 0.5rem;
		font-family: inherit;
	}

	output {
		color: light-dark(#16a34a, #4ade80);
	}

	output[role='alert'] {
		color: light-dark(#dc2626, #f87171);
	}

	.inner-fieldset {
		display: flex;
		flex-direction: column;
		row-gap: 0.75rem;
		border: 1px solid light-dark(oklch(14.5% 0 0), oklch(98.5% 0 0));
		padding-bottom: 1rem;
	}
	.inner-fieldset + .inner-fieldset {
		margin-top: 1rem;
	}
	.fieldset-items {
		display: flex;
		flex-direction: column;
		row-gap: 0.25rem;
	}

	.form-actions {
		margin: 0.5rem;
	}

	.btn-primary {
		padding: 0.5rem 1.5rem;
		border: 2px solid light-dark(oklch(14.5% 0 0), oklch(98.5% 0 0));
		border-radius: 6px;
		cursor: pointer;
		font-weight: 600;
		transition: color 0.1s linear;
	}

	.btn-danger-subtle {
		background: none;
		border: none;
		/* color: var(--color-muted); */
		cursor: pointer;
		font-size: 0.875rem;
		text-decoration: underline;
		padding: 0.5rem 0;
		margin: 0.5rem;
		transition: color 0.1s linear;
	}

	.btn-danger-subtle:hover {
		color: var(--f1-red);
	}
</style>
