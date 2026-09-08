<script lang="ts">
	import { resolve } from '$app/paths';
	import DiscordAvatar from '$lib/components/DiscordAvatar.svelte';

	let { data } = $props();

	const resultsHref = resolve('/season-4/results');

	const questionLabels = {
		sprint_pole: 'Sprint pole',
		sprint_p1: 'Sprint P1',
		pole: 'Race pole',
		p1: 'Race P1',
		p2: 'Race P2',
		p3: 'Race P3',
		p10: 'Race P10',
		dotd: 'Driver of the Day'
	} as const;
</script>

<svelte:head>
	<title>
		{data.weekend ? `${data.weekend.name} results | Season 4` : 'Season 4 results'}
	</title>

	<meta name="description" content="Published Season 4 prediction results and score breakdowns." />
</svelte:head>

<main class="standings-page">
	<header class="standings-heading">
		<h1 id="weekend-results">Weekend results</h1>

		<dl class="season-summary">
			<div>
				<dt>Published weekends</dt>
				<dd>{data.weekends.length}</dd>
			</div>

			<div>
				<dt>Entries</dt>
				<dd>{data.entries.length}</dd>
			</div>
		</dl>
	</header>

	{#if data.weekends.length > 0}
		<form class="weekend-picker" method="GET" action={resultsHref}>
			<label for="weekend">
				<span>Weekend</span>

				<select id="weekend" name="weekend">
					{#each data.weekends as weekend (weekend.id)}
						<option value={weekend.slug} selected={weekend.id === data.weekend?.id}>
							{weekend.name}
						</option>
					{/each}
				</select>
			</label>

			<button type="submit">View results</button>
		</form>
	{/if}

	{#if !data.weekend}
		<p class="empty-state">No published weekend results.</p>
	{:else}
		<section class="standings-section" aria-labelledby="official-results">
			<h2 id="official-results">Official results</h2>

			<dl class="official-grid">
				{#each data.officialResults as item (item.key)}
					<div>
						<dt>{questionLabels[item.key]}</dt>

						<dd>
							<span class="driver-code">
								{item.driver.code}
							</span>

							<span>{item.driver.name}</span>
						</dd>
					</div>
				{/each}
			</dl>
		</section>

		<section class="standings-section" aria-labelledby="weekend-scores">
			<h2 id="weekend-scores">
				{data.weekend.name} scores
			</h2>

			{#if data.entries.length === 0}
				<p class="empty-state">
					No entries for {data.weekend.name}.
				</p>
			{:else}
				<div class="score-breakout">
					<div class="score-list">
						<div
							class="score-header"
							class:regular-weekend={!data.weekend.isSprint}
							aria-hidden="true"
						>
							<span>Participant</span>
							<span>Team</span>
							<span>Race</span>

							{#if data.weekend.isSprint}
								<span>Sprint</span>
							{/if}

							<span>Bold</span>
							<span>Total</span>
							<span>Details</span>
						</div>

						{#each data.entries as entry (entry.userId)}
							<details class="score-entry">
								<summary>
									<span class="score-summary" class:regular-weekend={!data.weekend.isSprint}>
										<span class="participant">
											<DiscordAvatar
												defaultAvatarIndex={entry.defaultAvatarIndex}
												avatarSnapshotSha256={entry.userAvatarSnapshotSha256}
												size={32}
												alt=""
											/>

											<span>
												<span class="sr-only"> Participant: </span>

												{entry.userName}
											</span>
										</span>

										<span class="team-name">
											<span class="sr-only"> Team: </span>

											<span
												class="team-mark"
												style:--team-color={entry.team.color?.trim() || 'var(--accent)'}
												aria-hidden="true"
											></span>

											<span>{entry.team.name}</span>
										</span>

										<span class="metric">
											<span class="metric-label"> Race </span>

											<span class="numeric">
												{entry.score.racePoints}
											</span>
										</span>

										{#if data.weekend.isSprint}
											<span class="metric">
												<span class="metric-label"> Sprint </span>

												<span class="numeric">
													{entry.score.sprintPoints}
												</span>
											</span>
										{/if}

										<span class="metric">
											<span class="metric-label"> Bold </span>

											<span class="numeric">
												{entry.score.boldPoints}
											</span>
										</span>

										<span class="metric total">
											<span class="metric-label"> Total </span>

											<span class="numeric">
												{entry.score.totalPoints}
											</span>
										</span>

										<span class="detail-action">
											<span class="when-closed"> View details </span>

											<span class="when-open"> Hide details </span>
										</span>
									</span>
								</summary>

								<div class="score-detail">
									<dl class="prediction-list">
										{#each entry.score.items as item (item.key)}
											<div class="prediction-row">
												<dt>
													{questionLabels[item.key]}
												</dt>

												<dd>
													{#if item.predictedDriver}
														<span class="driver">
															<span class="driver-code">
																{item.predictedDriver.code}
															</span>

															<span>
																{item.predictedDriver.name}
															</span>
														</span>
													{:else}
														<span>No prediction</span>
													{/if}

													{#if item.correct}
														<span class="outcome">
															<span aria-hidden="true"> ✓ </span>

															<span class="sr-only"> Correct </span>
														</span>
													{:else}
														<span class="outcome">
															<span aria-hidden="true"> × </span>

															<span class="sr-only"> Incorrect. </span>
														</span>

														<span class="driver">
															<span class="sr-only"> Official result: </span>

															<span class="driver-code">
																{item.resultDriver.code}
															</span>

															<span>
																{item.resultDriver.name}
															</span>
														</span>
													{/if}
												</dd>
											</div>
										{/each}

										<div class="prediction-row bold-row">
											<dt>Bold prediction</dt>

											<dd>
												{#if entry.boldPrediction?.trim()}
													<span class="bold-text">
														{entry.boldPrediction}
													</span>

													<span class="outcome">
														<span aria-hidden="true">
															{entry.boldAwarded ? '✓' : '×'}
														</span>

														<span class="sr-only">
															{entry.boldAwarded ? 'Awarded' : 'Not awarded'}
														</span>
													</span>
												{:else}
													<span>No bold prediction</span>
												{/if}
											</dd>
										</div>
									</dl>
								</div>
							</details>
						{/each}
					</div>
				</div>
			{/if}
		</section>
	{/if}
</main>

<style>
	.weekend-picker {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--space-4);
		padding-block: var(--space-4);
		border-block: 1px solid var(--rule);
	}

	.weekend-picker label {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		gap: var(--space-2);
		max-width: 24rem;
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
		border-color: var(--accent);
		background: var(--accent);
		color: var(--page);
		font-weight: 700;
		cursor: pointer;
	}

	select:focus-visible,
	button:focus-visible,
	summary:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.official-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin: 0;
	}

	.official-grid > div {
		flex: 1 1 14rem;
		padding-inline-start: var(--space-3);
		border-inline-start: var(--space-1) solid var(--rule);
	}

	.official-grid dt {
		opacity: 0.68;
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.official-grid dd {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		margin: var(--space-1) 0 0;
		font-weight: 700;
	}

	.driver-code,
	.numeric,
	.outcome {
		font-family: 'Courier New', monospace;
		font-variant-numeric: tabular-nums;
	}

	.driver-code {
		color: var(--accent);
		font-weight: 700;
	}

	.score-breakout {
		position: relative;
		left: 50%;
		width: min(96rem, calc(100vw - var(--space-4) * 2));
		overflow-x: auto;
		background: var(--surface);
		transform: translateX(-50%);
		overscroll-behavior-inline: contain;
	}

	.score-list {
		min-width: 60rem;
	}

	.score-header,
	.score-summary {
		display: grid;
		grid-template-columns:
			minmax(12rem, 1.4fr)
			minmax(12rem, 1.2fr)
			repeat(4, minmax(3rem, 0.35fr))
			minmax(7rem, 0.55fr);
		align-items: center;
		gap: var(--space-3);
	}

	.score-header.regular-weekend,
	.score-summary.regular-weekend {
		grid-template-columns:
			minmax(12rem, 1.4fr)
			minmax(12rem, 1.2fr)
			repeat(3, minmax(3rem, 0.35fr))
			minmax(7rem, 0.55fr);
	}

	.score-header {
		min-height: 2.75rem;
		padding-inline: var(--space-3);
		border-bottom: 1px solid var(--rule);
		opacity: 0.68;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.score-entry {
		border-bottom: 1px solid var(--rule);
	}

	.score-entry:last-child {
		border-bottom: 0;
	}

	.score-entry summary {
		list-style: none;
		cursor: pointer;
	}

	.score-entry summary::-webkit-details-marker {
		display: none;
	}

	.score-entry summary:focus-visible {
		outline-offset: -3px;
	}

	.score-summary {
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
	}

	.participant,
	.team-name,
	.driver {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.participant,
	.team-name {
		min-width: 0;
		font-weight: 700;
	}

	.team-mark {
		flex: 0 0 auto;
		width: var(--space-1);
		height: var(--space-4);
		background: var(--team-color);
	}

	.metric {
		text-align: right;
	}

	.metric-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.total {
		color: var(--accent);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.detail-action {
		color: var(--accent);
		font-weight: 700;
	}

	.when-open {
		display: none;
	}

	.score-entry[open] .when-closed {
		display: none;
	}

	.score-entry[open] .when-open {
		display: inline;
	}

	.score-detail {
		padding: var(--space-4);
		border-top: 1px solid var(--rule);
		background: var(--page);
	}

	.prediction-list {
		margin: 0;
	}

	.prediction-row {
		display: flex;
		align-items: baseline;
		gap: var(--space-4);
		padding-block: var(--space-2);
		border-bottom: 1px solid var(--rule);
	}

	.prediction-row:last-child {
		border-bottom: 0;
	}

	.prediction-row dt {
		flex: 0 0 11rem;
		font-weight: 700;
	}

	.prediction-row dd {
		display: flex;
		flex: 1 1 auto;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
		min-width: 0;
		margin: 0;
	}

	.outcome {
		color: var(--accent);
		font-weight: 700;
	}

	.bold-row {
		align-items: flex-start;
	}

	.bold-text {
		max-width: 70ch;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 50rem) {
		.weekend-picker {
			align-items: stretch;
			flex-direction: column;
			gap: var(--space-3);
		}

		.weekend-picker label {
			max-width: none;
		}

		.score-breakout {
			width: calc(100vw - var(--space-3) * 2);
			overflow: visible;
		}

		.score-list {
			min-width: 0;
		}

		.score-header {
			display: none;
		}

		.score-summary,
		.score-summary.regular-weekend {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: var(--space-2);
			padding: var(--space-3);
		}

		.score-summary.regular-weekend {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.participant,
		.team-name,
		.detail-action {
			grid-column: 1 / -1;
		}

		.metric {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			text-align: left;
		}

		.metric-label {
			position: static;
			width: auto;
			height: auto;
			overflow: visible;
			clip: auto;
			opacity: 0.68;
			font-family: 'Titillium Web', sans-serif;
			font-size: 0.8125rem;
			font-weight: 700;
			text-transform: uppercase;
		}

		.score-detail {
			padding: var(--space-3);
		}

		.prediction-row {
			align-items: stretch;
			flex-direction: column;
			gap: var(--space-1);
			padding-block: var(--space-3);
		}

		.prediction-row dt {
			flex-basis: auto;
		}
	}
</style>
