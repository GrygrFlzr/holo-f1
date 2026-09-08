<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import DiscordAvatar from '$lib/components/DiscordAvatar.svelte';
	import { parseDateTime } from '$lib/time';
	import { SvelteDate } from 'svelte/reactivity';
	import DriverSelect from './DriverSelect.svelte';
	import LockTime from './LockTime.svelte';

	let { data, form } = $props();
	const { weekend, drivers, teams, submission, user } = $derived(data);
	const id = $props.id();

	const racePredictionFields = [
		{ key: 'pole_driver_id', label: 'Pole position' },
		{ key: 'p1_driver_id', label: 'P1' },
		{ key: 'p2_driver_id', label: 'P2' },
		{ key: 'p3_driver_id', label: 'P3' },
		{ key: 'p10_driver_id', label: 'P10' },
		{ key: 'dotd_driver_id', label: 'Driver of the Day' }
	] as const;

	const sprintPredictionFields = [
		{ key: 'sprint_pole_driver_id', label: 'Sprint pole position' },
		{ key: 'sprint_p1_driver_id', label: 'Sprint P1' }
	] as const;

	const now = new SvelteDate();
	let visibilityState: DocumentVisibilityState = $state('visible');
	const parsedLockTime = $derived(weekend ? parseDateTime(weekend.lock_time) : null);
	const remaining = $derived.by(() => {
		if (parsedLockTime) {
			const deadline = parsedLockTime.getTime();
			if (!isNaN(deadline)) {
				return deadline - now.getTime();
			}
		}
		return null;
	});
	const locked = $derived(remaining !== null ? remaining <= 0 : false);

	$effect(() => {
		if (visibilityState !== 'visible') return;
		now.setTime(Date.now());
		const interval = setInterval(() => now.setTime(Date.now()), 1_000);
		return () => {
			clearInterval(interval);
		};
	});
</script>

<svelte:document bind:visibilityState />

<svelte:head>
	<title>{weekend ? `Submit — ${weekend.name}` : 'Submissions Closed'} | Holo-F1</title>
	<meta name="description" content="Submit Predictions for a Formula 1 Weekend" />
</svelte:head>

<main class="standings-page submit-page">
	{#if !weekend}
		<header class="standings-heading">
			<h1>No open weekend</h1>
		</header>

		<p class="empty-state">There's no upcoming weekend accepting submissions right now.</p>
	{:else}
		<header class="standings-heading">
			<h1>{weekend.name}</h1>

			<dl class="season-summary">
				<div>
					<dt>Submission status</dt>
					<dd>{locked ? 'Closed' : submission ? 'Saved' : 'Open'}</dd>
				</div>

				<div>
					<dt>Submissions lock</dt>
					<dd class="lock-value">
						<LockTime lockTime={weekend.lock_time} />
					</dd>
				</div>

				{#if weekend.watchalong_host}
					<div>
						<dt>Watchalong host</dt>
						<dd class="text-value">{weekend.watchalong_host}</dd>
					</div>
				{/if}
			</dl>
		</header>

		<section class="account-band" aria-label="Account">
			<div class="account-content">
				{#if user}
					<div class="account-identity">
						<DiscordAvatar
							defaultAvatarIndex={user.default_avatar_index}
							avatarSnapshotSha256={user.avatar_snapshot_sha256}
							size={40}
							alt=""
						/>

						<strong>{user.display_name}</strong>
					</div>

					<form method="POST" action={resolve('/auth/logout')}>
						<button class="secondary-action" type="submit">Log out</button>
					</form>
				{:else if locked}
					<a class="primary-action" href={resolve('/auth/discord')}>Log in with Discord</a>
				{:else}
					<p>
						<a class="primary-action" href={resolve('/auth/discord')}>Log in with Discord</a>
						<span>to submit your predictions.</span>
					</p>
				{/if}
			</div>
		</section>

		<div class="action-status" aria-live="polite">
			{#if form?.error}
				<output role="alert">{form.error}</output>
			{:else if form?.success}
				<output>Predictions saved!</output>
			{:else if form?.cleared}
				<output>Predictions cleared.</output>
			{/if}
		</div>

		{#if !locked}
			{@render predictionForm(!user)}
		{:else}
			<section class="standings-section" aria-labelledby="submitted-predictions">
				<h2 id="submitted-predictions">Submitted predictions</h2>

				{#if user}
					{#if submission}
						{@const team = teams.find(({ id }) => id === submission.team_id)}

						<div class="review-layout">
							<section class="review-section" aria-labelledby="race-predictions">
								<h3 id="race-predictions">Race predictions</h3>

								<dl class="prediction-list">
									{#each racePredictionFields as field (field.key)}
										{@const driver = drivers.find(
											({ id: driverId }) => driverId === submission[field.key]
										)}

										<div>
											<dt>{field.label}</dt>
											<dd>{driver?.name ?? 'Unknown driver'}</dd>
										</div>
									{/each}
								</dl>
							</section>

							{#if weekend.is_sprint}
								<section class="review-section" aria-labelledby="sprint-predictions">
									<h3 id="sprint-predictions">Sprint predictions</h3>

									<dl class="prediction-list">
										{#each sprintPredictionFields as field (field.key)}
											{@const driver = drivers.find(
												({ id: driverId }) => driverId === submission[field.key]
											)}

											<div>
												<dt>{field.label}</dt>
												<dd>{driver?.name ?? 'Unknown driver'}</dd>
											</div>
										{/each}
									</dl>
								</section>
							{/if}

							<section class="review-section" aria-labelledby="team-and-bold">
								<h3 id="team-and-bold">Team and bold prediction</h3>

								<dl class="prediction-list">
									<div>
										<dt>Team</dt>
										<dd>
											{#if team}
												<span class="team-name">
													<span class="team-mark" style:--team-color={team.color} aria-hidden="true"
													></span>

													{team.name}
													{team.oshi_mark ?? ''}
												</span>
											{:else}
												Unknown team
											{/if}
										</dd>
									</div>

									<div>
										<dt>Bold prediction</dt>
										<dd>{submission.bold_prediction || 'No bold prediction'}</dd>
									</div>
								</dl>
							</section>
						</div>
					{:else}
						<p class="empty-state">You did not submit a prediction for this race weekend.</p>
					{/if}
				{:else}
					<p class="empty-state">Submission period has closed.</p>
				{/if}
			</section>
		{/if}
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

			<div class="prediction-layout">
				<fieldset class="prediction-section race-section">
					<legend>Race predictions</legend>

					<div class="field-controls">
						<DriverSelect
							name="pole_driver_id"
							label="Pole position"
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
					</div>
				</fieldset>

				{#if weekend.is_sprint}
					<fieldset class="prediction-section">
						<legend>Sprint predictions</legend>

						<div class="field-controls">
							<DriverSelect
								name="sprint_pole_driver_id"
								label="Sprint pole position"
								selectedId={submission?.sprint_pole_driver_id}
								{drivers}
							/>

							<DriverSelect
								name="sprint_p1_driver_id"
								label="Sprint winner"
								selectedId={submission?.sprint_p1_driver_id}
								{drivers}
							/>
						</div>
					</fieldset>
				{/if}

				<fieldset class="prediction-section">
					<legend>Team and bold prediction</legend>

					<div class="field-controls">
						<div class="form-field">
							<label for="team_id">Team for this weekend</label>

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

						<div class="form-field bold-field">
							<label for="bold_prediction">Bold prediction (optional)</label>

							<textarea id="bold_prediction" name="bold_prediction" rows="5"
								>{submission?.bold_prediction ?? ''}</textarea
							>
						</div>
					</div>
				</fieldset>
			</div>

			<div class="save-actions">
				<button class="primary-action" type="submit">Save predictions</button>

				<p>You can update your prediction any time before Qualifying starts.</p>
			</div>
		</form>

		<form class="delete-form" id="clear-{id}" method="POST" action="?/clear" use:enhance>
			<input type="hidden" name="weekend_id" value={weekend.id} />

			<button class="delete-action" type="submit">Delete submission</button>
		</form>
	</fieldset>
{/snippet}

<style>
	.submit-page {
		overflow-x: clip;
	}

	.lock-value,
	.text-value {
		font-family: inherit;
		font-size: 1rem;
		line-height: 1.5;
	}

	.account-band {
		position: relative;
		left: 50%;
		width: 100vw;
		border-block: 1px solid var(--rule);
		background: var(--surface);
		transform: translateX(-50%);
	}

	.account-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		max-width: 72rem;
		min-height: 5rem;
		margin-inline: auto;
		padding: var(--space-3) var(--space-4);
	}

	.account-content p,
	.save-actions p {
		margin: 0;
	}

	.account-content p {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}

	.account-identity {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.primary-action,
	.secondary-action,
	.delete-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding-inline: var(--space-4);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	a.primary-action {
		text-decoration: none;
	}

	.primary-action {
		border: 1px solid var(--accent);
		background: var(--accent);
		color: var(--page);
	}

	.secondary-action {
		border: 1px solid var(--rule);
		background: var(--surface);
		color: var(--ink);
	}

	.primary-action:focus-visible,
	.secondary-action:focus-visible,
	.delete-action:focus-visible,
	select:focus-visible,
	textarea:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.action-status {
		min-height: calc(var(--space-5) + var(--space-3));
		padding-block: var(--space-3);
		font-weight: 700;
	}

	.action-status output[role='alert'] {
		color: var(--accent);
	}

	.semantic-group {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	.prediction-layout {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr);
		gap: var(--space-5);
	}

	.prediction-section {
		min-width: 0;
		margin: 0;
		padding: var(--space-4) 0 0;
		border: 0;
		border-top: var(--space-1) solid var(--rule);
	}

	.race-section {
		grid-row: span 2;
		border-top-color: var(--accent);
	}

	.prediction-section legend {
		padding: 0;
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 700;
		line-height: 1;
	}

	.field-controls {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-block-start: var(--space-4);
	}

	.form-field {
		display: flex;
		flex: 1 1 14rem;
		flex-direction: column;
		gap: var(--space-2);
		min-width: min(100%, 14rem);
	}

	.form-field label {
		font-weight: 700;
	}

	.form-field select,
	.form-field textarea {
		width: 100%;
		border: 1px solid var(--rule);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	.form-field select {
		min-height: 2.75rem;
		padding-inline: var(--space-3);
	}

	.form-field textarea {
		min-height: 8rem;
		padding: var(--space-3);
		resize: vertical;
	}

	.bold-field {
		flex-basis: 100%;
	}

	.save-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-block-start: var(--space-5);
		padding-block: var(--space-4);
		border-block: 1px solid var(--rule);
	}

	.save-actions p {
		max-width: 60ch;
	}

	.delete-form {
		margin-block-start: var(--space-4);
	}

	.delete-action {
		padding-inline: 0;
		border: 0;
		background: transparent;
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: var(--space-1);
	}

	.semantic-group:disabled {
		opacity: 0.72;
	}

	.review-layout {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-5);
	}

	.review-section {
		flex: 1 1 18rem;
		min-width: 0;
		padding-block-start: var(--space-4);
		border-top: var(--space-1) solid var(--rule);
	}

	.review-section:first-child {
		border-top-color: var(--accent);
	}

	.review-section h3 {
		margin: 0 0 var(--space-3);
		font-size: 1.5rem;
		line-height: 1;
	}

	.prediction-list {
		margin: 0;
	}

	.prediction-list > div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4);
		padding-block: var(--space-2);
		border-bottom: 1px solid var(--rule);
	}

	.prediction-list dt {
		font-weight: 700;
	}

	.prediction-list dd {
		margin: 0;
		text-align: right;
	}

	.team-name {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.team-mark {
		flex: 0 0 auto;
		width: var(--space-1);
		height: var(--space-4);
		background: var(--team-color);
	}

	@media (max-width: 48rem) {
		.account-content {
			padding-inline: var(--space-3);
		}

		.prediction-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.race-section {
			grid-row: auto;
		}

		.save-actions {
			align-items: stretch;
			flex-direction: column;
		}

		.save-actions .primary-action {
			width: 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.form-field textarea {
			scroll-behavior: auto;
		}
	}
</style>
