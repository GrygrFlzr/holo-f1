import type { IndividualStanding } from '$lib/standings';
import { describe, expect, it } from 'vitest';
import {
	buildIndividualComparisonSearch,
	buildIndividualComparisonSeries,
	getComparisonParticipantIds,
	MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS,
	removeIndividualComparisonParticipant
} from './individual-comparison';

const TODO_TEST_WEEKEND_ID = Number.MAX_SAFE_INTEGER;

const TODO_TEST_PARTICIPANT_IDS = [
	'TODO_TEST_PARTICIPANT_A',
	'TODO_TEST_PARTICIPANT_B',
	'TODO_TEST_PARTICIPANT_C',
	'TODO_TEST_PARTICIPANT_D',
	'TODO_TEST_PARTICIPANT_E'
] as const;

const TODO_TEST_UNKNOWN_PARTICIPANT_ID = 'TODO_TEST_UNKNOWN_PARTICIPANT';

function createStanding(id: string, index: number): IndividualStanding {
	const TODO_TEST_TOTAL_POINTS = index + 1;

	return {
		id,
		name: `TODO_TEST_NAME_${index}`,
		avatarSnapshotSha256: null,
		defaultAvatarIndex: index % 6,
		rank: index + 1,
		totalPoints: TODO_TEST_TOTAL_POINTS,
		participation: 1,
		boldPoints: 0,
		histogram: [0, 0, 0, 0, 0, 0, 0],
		history: [
			{
				weekendId: TODO_TEST_WEEKEND_ID,
				weekendName: 'TODO_TEST_WEEKEND',
				roundPoints: TODO_TEST_TOTAL_POINTS,
				cumulativePoints: TODO_TEST_TOTAL_POINTS
			}
		]
	};
}

const TODO_TEST_STANDINGS: IndividualStanding[] = TODO_TEST_PARTICIPANT_IDS.map(createStanding);

function createSearchParams(ids: readonly string[]): URLSearchParams {
	const searchParams = new URLSearchParams();

	for (const id of ids) {
		searchParams.append('participant', id);
	}

	return searchParams;
}

describe('individual comparison', () => {
	it('uses a four-participant maximum', () => {
		expect(MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS).toBe(4);
	});

	it('returns no participant IDs when the parameter is absent', () => {
		expect(getComparisonParticipantIds(new URLSearchParams(), TODO_TEST_STANDINGS)).toEqual([]);
	});

	it('ignores empty, duplicate, and unknown participant IDs', () => {
		const searchParams = createSearchParams([
			'',
			TODO_TEST_PARTICIPANT_IDS[1],
			TODO_TEST_UNKNOWN_PARTICIPANT_ID,
			TODO_TEST_PARTICIPANT_IDS[1],
			TODO_TEST_PARTICIPANT_IDS[0]
		]);

		expect(getComparisonParticipantIds(searchParams, TODO_TEST_STANDINGS)).toEqual([
			TODO_TEST_PARTICIPANT_IDS[1],
			TODO_TEST_PARTICIPANT_IDS[0]
		]);
	});

	it('preserves participant order from the URL', () => {
		const searchParams = createSearchParams([
			TODO_TEST_PARTICIPANT_IDS[2],
			TODO_TEST_PARTICIPANT_IDS[0],
			TODO_TEST_PARTICIPANT_IDS[1]
		]);

		expect(getComparisonParticipantIds(searchParams, TODO_TEST_STANDINGS)).toEqual([
			TODO_TEST_PARTICIPANT_IDS[2],
			TODO_TEST_PARTICIPANT_IDS[0],
			TODO_TEST_PARTICIPANT_IDS[1]
		]);
	});

	it.each([
		{ count: 3, expectedCount: 3 },
		{ count: 4, expectedCount: 4 },
		{ count: 5, expectedCount: 4 }
	])(
		'retains $expectedCount selections from $count valid parameters',
		({ count, expectedCount }) => {
			const ids = TODO_TEST_PARTICIPANT_IDS.slice(0, count);
			const result = getComparisonParticipantIds(createSearchParams(ids), TODO_TEST_STANDINGS);

			expect(result).toEqual(ids.slice(0, expectedCount));
		}
	);

	it('builds comparison series in participant order', () => {
		const participantIds = [
			TODO_TEST_PARTICIPANT_IDS[3],
			TODO_TEST_PARTICIPANT_IDS[1],
			TODO_TEST_PARTICIPANT_IDS[0]
		];

		const series = buildIndividualComparisonSeries(TODO_TEST_STANDINGS, participantIds);

		expect(series.map(({ id }) => id)).toEqual(participantIds);
		expect(series.map(({ totalPoints }) => totalPoints)).toEqual([4, 2, 1]);
		expect(new Set(series.map(({ color }) => color)).size).toBe(3);
	});

	it('limits series and ignores duplicate and unavailable IDs', () => {
		const series = buildIndividualComparisonSeries(TODO_TEST_STANDINGS, [
			TODO_TEST_PARTICIPANT_IDS[0],
			TODO_TEST_UNKNOWN_PARTICIPANT_ID,
			TODO_TEST_PARTICIPANT_IDS[0],
			TODO_TEST_PARTICIPANT_IDS[1],
			TODO_TEST_PARTICIPANT_IDS[2],
			TODO_TEST_PARTICIPANT_IDS[3],
			TODO_TEST_PARTICIPANT_IDS[4]
		]);

		expect(series.map(({ id }) => id)).toEqual(
			TODO_TEST_PARTICIPANT_IDS.slice(0, MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS)
		);
	});

	it('builds repeated participant search parameters in order', () => {
		const search = buildIndividualComparisonSearch([
			TODO_TEST_PARTICIPANT_IDS[2],
			TODO_TEST_PARTICIPANT_IDS[0]
		]);

		expect(new URLSearchParams(search).getAll('participant')).toEqual([
			TODO_TEST_PARTICIPANT_IDS[2],
			TODO_TEST_PARTICIPANT_IDS[0]
		]);
	});

	it('deduplicates and limits built search parameters', () => {
		const search = buildIndividualComparisonSearch([
			TODO_TEST_PARTICIPANT_IDS[0],
			TODO_TEST_PARTICIPANT_IDS[0],
			TODO_TEST_PARTICIPANT_IDS[1],
			TODO_TEST_PARTICIPANT_IDS[2],
			TODO_TEST_PARTICIPANT_IDS[3],
			TODO_TEST_PARTICIPANT_IDS[4]
		]);

		expect(new URLSearchParams(search).getAll('participant')).toEqual(
			TODO_TEST_PARTICIPANT_IDS.slice(0, MAX_INDIVIDUAL_COMPARISON_PARTICIPANTS)
		);
	});

	it('removes one participant without changing the remaining order', () => {
		const result = removeIndividualComparisonParticipant(
			[TODO_TEST_PARTICIPANT_IDS[2], TODO_TEST_PARTICIPANT_IDS[0], TODO_TEST_PARTICIPANT_IDS[1]],
			TODO_TEST_PARTICIPANT_IDS[0]
		);

		expect(result).toEqual([TODO_TEST_PARTICIPANT_IDS[2], TODO_TEST_PARTICIPANT_IDS[1]]);
	});
});
