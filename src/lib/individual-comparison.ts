import type { IndividualStanding, StandingPoint } from '$lib/standings';

export const MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS = 4;

const COMPARISON_COLORS = [
	'hsl(4 100% 66%)',
	'hsl(188 85% 62%)',
	'hsl(45 95% 65%)',
	'hsl(278 82% 75%)'
] as const;

export interface IndividualComparisonSeries {
	id: string;
	name: string;
	avatarSnapshotSha256: string | null;
	defaultAvatarIndex: number;
	totalPoints: number;
	color: string;
	history: readonly StandingPoint[];
}

export function getComparisonParticipantIds(
	searchParams: URLSearchParams,
	standings: readonly IndividualStanding[]
): string[] {
	const availableIds = new Set(standings.map((standing) => standing.id));
	const selectedIds: string[] = [];
	const seenIds = new Set<string>();

	for (const id of searchParams.getAll('participant')) {
		if (selectedIds.length === MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS) {
			break;
		}

		if (id === '' || seenIds.has(id) || !availableIds.has(id)) {
			continue;
		}

		seenIds.add(id);
		selectedIds.push(id);
	}

	return selectedIds;
}

export function buildIndividualComparisonSeries(
	standings: readonly IndividualStanding[],
	participantIds: readonly string[]
): IndividualComparisonSeries[] {
	const standingsById = new Map(standings.map((standing) => [standing.id, standing]));
	const includedIds = new Set<string>();
	const series: IndividualComparisonSeries[] = [];

	for (const id of participantIds) {
		if (series.length === MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS) {
			break;
		}

		if (includedIds.has(id)) {
			continue;
		}

		const standing = standingsById.get(id);

		if (!standing) {
			continue;
		}

		includedIds.add(id);
		series.push({
			id: standing.id,
			name: standing.name,
			avatarSnapshotSha256: standing.avatarSnapshotSha256,
			defaultAvatarIndex: standing.defaultAvatarIndex,
			totalPoints: standing.totalPoints,
			color: COMPARISON_COLORS[series.length],
			history: standing.history
		});
	}

	return series;
}

export function buildIndividualComparisonSearch(participantIds: readonly string[]): string {
	const searchParams = new URLSearchParams();
	const includedIds = new Set<string>();

	for (const id of participantIds) {
		if (includedIds.size === MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS) {
			break;
		}

		if (id === '' || includedIds.has(id)) {
			continue;
		}

		includedIds.add(id);
		searchParams.append('participant', id);
	}

	return searchParams.toString();
}

export function removeIndividualComparisonParticipant(
	participantIds: readonly string[],
	participantId: string
): string[] {
	return participantIds
		.filter((id) => id !== participantId)
		.slice(0, MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS);
}
