<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DiscordAvatar from '$lib/components/DiscordAvatar.svelte';
	import ProgressionSparkline from '$lib/components/ProgressionSparkline.svelte';
	import {
		getComparisonParticipantIds,
		MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS
	} from '$lib/individual-comparison';

	let { data } = $props();

	const raceScores = [6, 5, 4, 3, 2, 1, 0] as const;
	const individualsHref = resolve('/season-4/individuals');
	const comparisonHref = resolve('/season-4/individuals/compare');

	let standings = $derived(data.standings.individuals);
	let weekends = $derived(data.standings.weekends);
	let weekendCount = $derived(weekends.length);

	let selectedParticipantIds = $derived(
		getComparisonParticipantIds(page.url.searchParams, standings)
	);

	let selectedParticipantIdSet = $derived(new Set(selectedParticipantIds));

	let selectedParticipants = $derived(
		standings.filter((standing) => selectedParticipantIdSet.has(standing.id))
	);

	let selectionFull = $derived(
		selectedParticipantIds.length >= MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS
	);

	function updateSelection(event: Event, participantId: string): void {
		const checkbox = event.currentTarget as HTMLInputElement;

		if (checkbox.checked) {
			if (selectionFull || selectedParticipantIdSet.has(participantId)) {
				checkbox.checked = selectedParticipantIdSet.has(participantId);
				return;
			}

			selectedParticipantIds = [...selectedParticipantIds, participantId];
			return;
		}

		selectedParticipantIds = selectedParticipantIds.filter((id) => id !== participantId);
	}

	function clearSelection(): void {
		selectedParticipantIds = [];
	}
</script>

<svelte:head>
	<title>Season 4 individual standings</title>
	<meta name="description" content="Season 4 individual prediction standings." />
</svelte:head>

<main class="standings-page">
	<header class="standings-heading">
		<h1 id="individual-standings">Individual standings</h1>

		<dl class="season-summary">
			<div>
				<dt>Scored weekends</dt>
				<dd>{weekendCount}</dd>
			</div>

			<div>
				<dt>Participants</dt>
				<dd>{standings.length}</dd>
			</div>
		</dl>
	</header>

	{#if standings.length === 0}
		<p class="empty-state">No published individual scores.</p>
	{:else}
		<form class="comparison-form" method="GET" action={comparisonHref}>
			<div class="table-scroll">
				<table class="standings-table" aria-labelledby="individual-standings">
					<thead>
						<tr>
							<th scope="col">Rank</th>
							<th scope="col">Participant</th>
							<th scope="col">Compare</th>
							<th scope="col">Points</th>
							<th scope="col">Entries</th>
							<th scope="col">Bold points</th>

							{#each raceScores as raceScore (raceScore)}
								<th scope="col">
									{raceScore}/6
								</th>
							{/each}

							<th scope="col">Progression</th>
						</tr>
					</thead>

					<tbody>
						{#each standings as standing (standing.id)}
							{@const selected = selectedParticipantIdSet.has(standing.id)}
							{@const unavailable = selectionFull && !selected}

							<tr>
								<td class="rank">
									{standing.rank}
								</td>

								<th scope="row">
									<span class="participant">
										<DiscordAvatar
											defaultAvatarIndex={standing.defaultAvatarIndex}
											avatarSnapshotSha256={standing.avatarSnapshotSha256}
											size={32}
											alt=""
										/>

										<span>{standing.name}</span>
									</span>
								</th>

								<td class="comparison-cell">
									<label class="comparison-toggle" class:unavailable>
										<input
											class="comparison-checkbox"
											type="checkbox"
											name="participant"
											value={standing.id}
											checked={selected}
											disabled={unavailable}
											aria-label={selected
												? `Remove ${standing.name} from comparison`
												: `Add ${standing.name} to comparison`}
											onchange={(event) => updateSelection(event, standing.id)}
										/>
									</label>
								</td>

								<td class="score">
									{standing.totalPoints}
								</td>

								<td class="count">
									{standing.participation}
								</td>

								<td class="count">
									{standing.boldPoints}
								</td>

								{#each raceScores as raceScore (raceScore)}
									<td class="count">
										{standing.histogram[raceScore]}
									</td>
								{/each}

								<td class="progression">
									<ProgressionSparkline
										history={standing.history}
										label={`${standing.name} cumulative points`}
									/>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<aside class="selection-tray" aria-label="Comparison queue">
				<div class="selection-tray-content">
					<div class="selection-summary" aria-live="polite">
						<strong>Comparison queue</strong>

						{#if selectedParticipants.length > 0}
							<ul>
								{#each selectedParticipants as standing (standing.id)}
									<li>
										<DiscordAvatar
											defaultAvatarIndex={standing.defaultAvatarIndex}
											avatarSnapshotSha256={standing.avatarSnapshotSha256}
											size={24}
											alt=""
										/>

										<span>{standing.name}</span>
									</li>
								{/each}
							</ul>

							{#if selectionFull}
								<p>Four participant maximum reached.</p>
							{/if}
						{/if}

						<noscript>
							<p>Checked participants will be compared.</p>
						</noscript>
					</div>

					<div class="selection-actions">
						<button type="submit">Compare selected</button>

						<a href={individualsHref} onclick={clearSelection}>Clear selection</a>
					</div>
				</div>
			</aside>
		</form>
	{/if}
</main>

<style>
	.comparison-form {
		margin: 0;
	}

	.comparison-form:has(.comparison-checkbox:checked) {
		padding-block-end: calc(var(--space-5) * 4);
	}

	.participant {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.comparison-cell {
		padding: 0;
		text-align: center;
	}

	.comparison-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.75rem;
		min-height: 2.75rem;
		cursor: pointer;
	}

	.comparison-toggle.unavailable {
		cursor: not-allowed;
		opacity: 0.48;
	}

	.comparison-checkbox {
		width: 1.25rem;
		height: 1.25rem;
		margin: 0;
		accent-color: var(--accent);
	}

	.comparison-checkbox:focus-visible,
	.selection-actions button:focus-visible,
	.selection-actions a:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.selection-tray {
		display: none;
		position: fixed;
		z-index: 20;
		inset-inline: 0;
		bottom: 0;
		border-block-start: 1px solid var(--accent);
		background: var(--surface);
		color: var(--ink);
	}

	.comparison-form:has(.comparison-checkbox:checked) .selection-tray {
		display: block;
	}

	.selection-tray-content {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
	}

	.selection-summary {
		min-width: 0;
	}

	.selection-summary strong {
		display: block;
		margin-block-end: var(--space-2);
	}

	.selection-summary ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.selection-summary li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-weight: 700;
	}

	.selection-summary p {
		margin: var(--space-2) 0 0;
	}

	.selection-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
	}

	.selection-actions button,
	.selection-actions a {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding-inline: var(--space-4);
		border: 1px solid var(--accent);
		font: inherit;
		font-weight: 700;
		text-decoration: none;
	}

	.selection-actions button {
		background: var(--accent);
		color: var(--page);
		cursor: pointer;
	}

	.selection-actions a {
		background: var(--surface);
		color: var(--ink);
	}

	@media (max-width: 48rem) {
		.selection-tray-content {
			grid-template-columns: 1fr;
			gap: var(--space-3);
		}
	}
</style>
