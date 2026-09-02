<script lang="ts">
	let { data, form } = $props();

	const raceResultFields = [
		{
			name: 'pole_driver_id',
			label: 'Race pole'
		},
		{
			name: 'p1_driver_id',
			label: 'P1'
		},
		{
			name: 'p2_driver_id',
			label: 'P2'
		},
		{
			name: 'p3_driver_id',
			label: 'P3'
		},
		{
			name: 'p10_driver_id',
			label: 'P10'
		},
		{
			name: 'dotd_driver_id',
			label: 'Driver of the Day'
		}
	] as const;

	const sprintResultFields = [
		{
			name: 'sprint_pole_driver_id',
			label: 'Sprint pole'
		},
		{
			name: 'sprint_p1_driver_id',
			label: 'Sprint P1'
		}
	] as const;

	type ResultField = (typeof raceResultFields)[number] | (typeof sprintResultFields)[number];

	let boldEntries = $derived(
		data.entries.filter(
			(entry) =>
				typeof entry.bold_prediction === 'string' && entry.bold_prediction.trim().length > 0
		)
	);

	function avatarBase(entry: { discord_id: string; avatar_hash: string | null }): string {
		if (entry.avatar_hash) {
			return `https://cdn.discordapp.com/avatars/${entry.discord_id}/${entry.avatar_hash}.webp`;
		}

		const defaultAvatar = (BigInt(entry.discord_id) >> 22n) % 6n;

		return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
	}
</script>

{#snippet resultSelect(field: ResultField)}
	<label class="result-field" for={`result-${field.name}`}>
		<span>{field.label}</span>

		<select id={`result-${field.name}`} name={field.name} required>
			<option value="" selected={data.result?.[field.name] == null}> Select driver </option>

			{#each data.drivers as driver (driver.id)}
				<option value={driver.id} selected={data.result?.[field.name] === driver.id}>
					{driver.code} — {driver.name}
				</option>
			{/each}
		</select>
	</label>
{/snippet}

{#snippet resultReadout(field: ResultField)}
	{@const driver = data.drivers.find((candidate) => candidate.id === data.result?.[field.name])}

	<div class="result-field">
		<dt>{field.label}</dt>
		<dd>
			{#if driver}
				{driver.code} — {driver.name}
			{:else}
				Not saved
			{/if}
		</dd>
	</div>
{/snippet}

<svelte:head>
	<title>Steward dashboard</title>
</svelte:head>

<main>
	<header class="page-header">
		<h1>Steward dashboard</h1>

		{#if form?.message}
			<p class:form-error={form.ok === false} aria-live="polite">
				{form.message}
			</p>
		{/if}
	</header>

	{#if data.weekends.length > 0}
		<form class="page-header" method="GET">
			<label class="result-field" for="weekend">
				<span>Weekend</span>

				<select id="weekend" name="weekend">
					{#each data.weekends as option (option.id)}
						<option value={option.id} selected={option.id === data.weekend?.id}>
							{option.name}
							—
							{option.scored === 1 ? 'Published' : 'Unpublished'}
						</option>
					{/each}
				</select>
			</label>

			<button type="submit">View weekend</button>
		</form>
	{/if}

	{#if !data.weekend}
		<p>No unscored weekends.</p>
	{:else}
		<section aria-labelledby="weekend-heading">
			<div class="weekend-heading">
				<h2 id="weekend-heading">
					{data.weekend.name}
				</h2>

				<p class="weekend-status">
					{data.locked ? 'Locked' : 'Open'}
					—
					{data.entries.length}
					{data.entries.length === 1 ? 'entry' : 'entries'}
				</p>
			</div>

			{#if data.entries.length === 0}
				<p>No submissions.</p>
			{:else}
				<div class="table-shell">
					<table>
						<thead>
							<tr>
								<th scope="col">Avatar</th>
								<th scope="col">Name</th>
								<th scope="col">Submitted</th>

								{#if data.locked}
									{#if data.weekend.is_sprint === 1}
										<th scope="col">Sprint pole</th>
										<th scope="col">Sprint P1</th>
									{/if}

									<th scope="col">Race pole</th>
									<th scope="col">P1</th>
									<th scope="col">P2</th>
									<th scope="col">P3</th>
									<th scope="col">P10</th>
									<th scope="col">DotD</th>
								{/if}

								<th scope="col">Team</th>

								{#if data.result}
									<th scope="col">Race points</th>

									{#if data.weekend.is_sprint === 1}
										<th scope="col"> Sprint points </th>
									{/if}

									<th scope="col">Bold point</th>
									<th scope="col">Total</th>
								{/if}
							</tr>
						</thead>

						<tbody>
							{#each data.entries as entry (entry.discord_id)}
								{@const baseImage = avatarBase(entry)}

								<tr>
									<td class="avatar-cell">
										<img
											class="avatar"
											alt={`Avatar for ${entry.discord_name}`}
											src={`${baseImage}?size=40`}
											srcset={[
												[`${baseImage}?size=40`, '1x'],
												[`${baseImage}?size=80`, '2x'],
												[`${baseImage}?size=120`, '3x']
											]
												.map(([url, density]) => `${url} ${density}`)
												.join(', ')}
											width="40"
											height="40"
										/>
									</td>

									<td>{entry.discord_name}</td>

									<td class="numeric">
										{entry.updated_at}
									</td>

									{#if data.locked}
										{#if data.weekend.is_sprint === 1}
											<td class="prediction">
												{entry.sprint_pole_code}
											</td>
											<td class="prediction">
												{entry.sprint_p1_code}
											</td>
										{/if}

										<td class="prediction">
											{entry.pole_code}
										</td>
										<td class="prediction">
											{entry.p1_code}
										</td>
										<td class="prediction">
											{entry.p2_code}
										</td>
										<td class="prediction">
											{entry.p3_code}
										</td>
										<td class="prediction">
											{entry.p10_code}
										</td>
										<td class="prediction">
											{entry.dotd_code}
										</td>
									{/if}

									<td class="team" style:--team-color={entry.team_color}>
										{entry.team_name}
									</td>

									{#if entry.scorePreview}
										<td class="score">
											{entry.scorePreview.racePoints}
										</td>

										{#if data.weekend.is_sprint === 1}
											<td class="score">
												{entry.scorePreview.sprintPoints}
											</td>
										{/if}

										<td class="score">
											{entry.scorePreview.boldPoints}
										</td>
										<td class="score total">
											{entry.scorePreview.totalPoints}
										</td>
									{/if}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>

		{#if data.locked}
			<section aria-labelledby="results-heading">
				<h2 id="results-heading">Official results</h2>
				{#if data.weekend.scored === 1}
					{#if data.result}
						<dl class="result-fields">
							{#each raceResultFields as field (field.name)}
								{@render resultReadout(field)}
							{/each}

							{#if data.weekend.is_sprint === 1}
								{#each sprintResultFields as field (field.name)}
									{@render resultReadout(field)}
								{/each}
							{/if}
						</dl>
					{:else}
						<p>Official results have not been saved.</p>
					{/if}
				{:else}
					<form
						class="results-form"
						method="POST"
						action={`?/saveResults&weekend=${data.weekend.id}`}
					>
						<input type="hidden" name="weekend_id" value={data.weekend.id} />

						<fieldset>
							<legend>Race</legend>

							<div class="result-fields">
								{#each raceResultFields as field (field.name)}
									{@render resultSelect(field)}
								{/each}
							</div>
						</fieldset>

						{#if data.weekend.is_sprint === 1}
							<fieldset>
								<legend>Sprint</legend>

								<div class="result-fields">
									{#each sprintResultFields as field (field.name)}
										{@render resultSelect(field)}
									{/each}
								</div>
							</fieldset>
						{/if}

						<div class="form-actions">
							<button type="submit">Save results</button>
						</div>
					</form>
				{/if}
			</section>

			<section aria-labelledby="bold-heading">
				<h2 id="bold-heading">Bold predictions</h2>

				{#if boldEntries.length === 0}
					<p>No bold predictions were submitted.</p>
				{:else}
					<form method="POST" action={`?/saveBoldReviews&weekend=${data.weekend.id}`}>
						<input type="hidden" name="weekend_id" value={data.weekend.id} />

						<ul class="bold-reviews">
							{#each boldEntries as entry (entry.discord_id)}
								<li>
									<input type="hidden" name="reviewed_user_id" value={entry.discord_id} />

									<div class="bold-content">
										<strong>
											{entry.discord_name}
										</strong>
										<p>
											{entry.bold_prediction}
										</p>
									</div>

									<label class="bold-award">
										<input
											type="checkbox"
											name="awarded_user_id"
											value={entry.discord_id}
											checked={entry.boldReview?.awarded === 1}
										/>
										<span>Award bold point</span>
									</label>
								</li>
							{/each}
						</ul>

						<div class="form-actions">
							<button type="submit"> Save bold reviews </button>
						</div>
					</form>
				{/if}
			</section>

			{#if data.weekend.scored === 0}
				<section class="publish" aria-labelledby="publish-heading">
					<h2 id="publish-heading">Publish weekend</h2>

					{#if !data.result}
						<p>Official results have not been saved.</p>
					{/if}

					{#if data.missingBoldReviewCount > 0}
						<p>
							{data.missingBoldReviewCount}
							{data.missingBoldReviewCount === 1 ? 'bold prediction has' : 'bold predictions have'}
							not been reviewed.
						</p>
					{/if}

					<form method="POST" action={`?/publish&weekend=${data.weekend.id}`}>
						<input type="hidden" name="weekend_id" value={data.weekend.id} />

						<button class="publish-button" type="submit" disabled={!data.canPublish}>
							Publish weekend
						</button>
					</form>
				</section>
			{/if}
		{/if}
	{/if}
</main>

<style>
	main {
		--paper: #15151d;
		--surface: #050506;
		--ink: #ffffff;
		--rule: #38383f;
		--accent: #e10600;

		--space-1: 0.25rem;
		--space-2: 0.5rem;
		--space-3: 1rem;
		--space-4: 1.5rem;
		--space-5: 2.5rem;

		min-height: 100%;
		padding: var(--space-5);
		overflow: hidden;
		background: var(--paper);
		color: var(--ink);
		font-family: Arial, sans-serif;
		line-height: 1.5;
	}

	h1,
	h2,
	p {
		margin-block-start: 0;
	}

	h1 {
		margin-block-end: 0;
		font-size: clamp(2rem, 6vw, 4rem);
		line-height: 1;
		text-transform: uppercase;
	}

	h2 {
		margin-block-end: var(--space-3);
		font-size: clamp(1.5rem, 3vw, 2.25rem);
		line-height: 1.1;
	}

	p {
		max-width: 70ch;
	}

	section {
		margin-block-start: var(--space-5);
	}

	.page-header,
	.weekend-heading,
	.form-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.page-header,
	.weekend-heading {
		justify-content: space-between;
	}

	.page-header p,
	.weekend-heading p {
		margin: 0;
	}

	.form-error {
		color: var(--accent);
		font-weight: 700;
	}

	.weekend-status,
	.numeric,
	.prediction,
	.score {
		font-family: 'Courier New', monospace;
		font-variant-numeric: tabular-nums;
	}

	.weekend-status {
		opacity: 0.72;
	}

	.table-shell {
		width: calc(100% + var(--space-5));
		margin-inline-end: calc(-1 * var(--space-5));
		overflow-x: auto;
		background: var(--surface);
		overscroll-behavior-inline: contain;
	}

	table {
		width: 100%;
		min-width: 76rem;
		border-collapse: collapse;
		text-align: left;
	}

	th,
	td {
		padding: var(--space-2) var(--space-3);
		border-bottom: 1px solid var(--rule);
		vertical-align: middle;
		white-space: nowrap;
	}

	th {
		height: 2.75rem;
		opacity: 0.72;
		font-size: 0.875rem;
		text-transform: uppercase;
	}

	td {
		height: 3.5rem;
	}

	.avatar-cell {
		width: var(--space-5);
	}

	.avatar {
		display: block;
		width: var(--space-5);
		height: var(--space-5);
		object-fit: cover;
	}

	.prediction,
	.score {
		text-align: right;
	}

	.total {
		color: var(--accent);
		font-weight: 700;
	}

	.team {
		border-inline-start: var(--space-1) solid var(--team-color);
	}

	.results-form {
		background: var(--surface);
	}

	fieldset {
		min-inline-size: 0;
		margin: 0;
		padding: var(--space-4);
		border: 0;
		border-bottom: 1px solid var(--rule);
	}

	legend {
		padding: var(--space-4) 0 0;
		font-size: 1.125rem;
		font-weight: 700;
	}

	.result-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: var(--space-3);
	}

	.result-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-weight: 700;
	}

	select,
	button {
		min-height: 2.75rem;
		border: 1px solid var(--rule);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	select {
		width: 100%;
		padding-inline: var(--space-3);
	}

	button {
		padding-inline: var(--space-4);
		cursor: pointer;
		font-weight: 700;
	}

	button:hover:not(:disabled) {
		border-color: var(--accent);
	}

	button:focus-visible,
	select:focus-visible,
	input:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.results-form .form-actions {
		padding: var(--space-3) var(--space-4);
	}

	.bold-reviews {
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--rule);
		list-style: none;
	}

	.bold-reviews li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding-block: var(--space-3);
		border-bottom: 1px solid var(--rule);
	}

	.bold-content p {
		margin: var(--space-1) 0 0;
	}

	.bold-award {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.75rem;
		white-space: nowrap;
	}

	.bold-award input {
		width: var(--space-4);
		height: var(--space-4);
		accent-color: var(--accent);
	}

	.bold-reviews + .form-actions {
		margin-block-start: var(--space-3);
	}

	.publish {
		padding-block-start: var(--space-4);
		border-top: 1px solid var(--rule);
	}

	.publish-button {
		border-color: var(--accent);
		background: var(--accent);
	}

	@media (max-width: 48rem) {
		main {
			padding: var(--space-3);
		}

		.table-shell {
			width: calc(100% + var(--space-3));
			margin-inline-end: calc(-1 * var(--space-3));
		}

		.bold-reviews li {
			align-items: flex-start;
			flex-direction: column;
			gap: var(--space-2);
		}
	}
</style>
