import { describe, expect, it } from 'vitest';
import {
	buildSeasonStandings,
	type IndividualStanding,
	type ScoredStandingEntry,
	type SeasonStandings,
	type StandingWeekend,
	type TeamStanding
} from './standings';

const TEST_WEEKEND_IDS = {
	a: 90_001,
	b: 90_002,
	c: 90_003
} as const;

const TEST_WEEKENDS: StandingWeekend[] = [
	{
		id: TEST_WEEKEND_IDS.a,
		name: 'TEST_WEEKEND_A',
		lockTime: 'TEST_LOCK_TIME_A',
		isSprint: false
	},
	{
		id: TEST_WEEKEND_IDS.b,
		name: 'TEST_WEEKEND_B',
		lockTime: 'TEST_LOCK_TIME_B',
		isSprint: true
	},
	{
		id: TEST_WEEKEND_IDS.c,
		name: 'TEST_WEEKEND_C',
		lockTime: 'TEST_LOCK_TIME_C',
		isSprint: false
	}
];

type EntryFixture = Omit<ScoredStandingEntry, 'totalPoints'>;

const BASE_ENTRY: EntryFixture = {
	weekendId: TEST_WEEKEND_IDS.a,
	userId: 'TEST_USER_A',
	userName: 'TEST_PARTICIPANT_A',
	userAvatarSnapshotSha256: null,
	userDefaultAvatarIndex: 0,
	teamId: 80_001,
	teamName: 'TEST_TEAM_A',
	teamColor: null,
	racePoints: 0,
	sprintPoints: 0,
	boldPoints: 0
};

function createEntry(overrides: Partial<EntryFixture> = {}): ScoredStandingEntry {
	const entry: EntryFixture = {
		...BASE_ENTRY,
		...overrides
	};

	return {
		...entry,
		totalPoints: entry.racePoints + entry.sprintPoints + entry.boldPoints
	};
}

function requireIndividual(standings: SeasonStandings, id: string): IndividualStanding {
	const standing = standings.individuals.find((candidate) => candidate.id === id);

	if (!standing) {
		throw new Error(`Missing test individual with ID ${id}`);
	}

	return standing;
}

function requireTeam(standings: SeasonStandings, id: number): TeamStanding {
	const standing = standings.teams.find((candidate) => candidate.id === id);

	if (!standing) {
		throw new Error(`Missing test team with ID ${id}`);
	}

	return standing;
}

describe('buildSeasonStandings aggregation', () => {
	it('returns empty standings for an empty season', () => {
		expect(buildSeasonStandings(4, [], [])).toEqual({
			season: 4,
			weekends: [],
			individuals: [],
			teams: []
		});
	});

	it('retains published weekends when there are no entries', () => {
		const weekends = TEST_WEEKENDS.slice(0, 2);
		const standings = buildSeasonStandings(4, weekends, []);

		expect(standings.weekends).toEqual(weekends);
		expect(standings.individuals).toEqual([]);
		expect(standings.teams).toEqual([]);
	});

	it('counts zero-point participation and uses race points for the histogram', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 2), [
			createEntry({
				weekendId: TEST_WEEKEND_IDS.a
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				racePoints: 2,
				sprintPoints: 2,
				boldPoints: 1
			})
		]);

		const individual = requireIndividual(standings, 'TEST_USER_A');

		expect(individual).toMatchObject({
			totalPoints: 5,
			participation: 2,
			boldPoints: 1
		});
		expect(individual.histogram).toEqual([1, 0, 1, 0, 0, 0, 0]);
		expect(
			individual.history.map(({ roundPoints, cumulativePoints }) => ({
				roundPoints,
				cumulativePoints
			}))
		).toEqual([
			{
				roundPoints: 0,
				cumulativePoints: 0
			},
			{
				roundPoints: 5,
				cumulativePoints: 5
			}
		]);
	});

	it('uses the team recorded on each historical submission', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 2), [
			createEntry({
				weekendId: TEST_WEEKEND_IDS.a,
				racePoints: 2,
				teamId: 80_001,
				teamName: 'TEST_TEAM_A'
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				racePoints: 3,
				teamId: 80_002,
				teamName: 'TEST_TEAM_B'
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				userId: 'TEST_USER_B',
				userName: 'TEST_PARTICIPANT_B',
				racePoints: 1,
				boldPoints: 1,
				teamId: 80_002,
				teamName: 'TEST_TEAM_B'
			})
		]);

		const individual = requireIndividual(standings, 'TEST_USER_A');
		const teamA = requireTeam(standings, 80_001);
		const teamB = requireTeam(standings, 80_002);

		expect(individual).toMatchObject({
			totalPoints: 5,
			participation: 2
		});

		expect(teamA).toMatchObject({
			totalPoints: 2,
			participation: 1,
			boldPoints: 0
		});
		expect(
			teamA.history.map(({ roundPoints, cumulativePoints }) => [roundPoints, cumulativePoints])
		).toEqual([
			[2, 2],
			[0, 2]
		]);

		expect(teamB).toMatchObject({
			totalPoints: 5,
			participation: 2,
			boldPoints: 1
		});
		expect(
			teamB.history.map(({ roundPoints, cumulativePoints }) => [roundPoints, cumulativePoints])
		).toEqual([
			[0, 0],
			[5, 5]
		]);
	});

	it('carries cumulative points through missed weekends', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS, [
			createEntry({
				weekendId: TEST_WEEKEND_IDS.a,
				racePoints: 2
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.c,
				racePoints: 3
			})
		]);

		const individual = requireIndividual(standings, 'TEST_USER_A');

		expect(
			individual.history.map(({ roundPoints, cumulativePoints }) => [roundPoints, cumulativePoints])
		).toEqual([
			[2, 2],
			[0, 2],
			[3, 5]
		]);
	});

	it('retains the participant avatar snapshot', () => {
		const avatarSnapshotSha256 = '0123456789abcdef'.repeat(4);

		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 1), [
			createEntry({
				userAvatarSnapshotSha256: avatarSnapshotSha256
			})
		]);

		expect(requireIndividual(standings, 'TEST_USER_A').avatarSnapshotSha256).toBe(
			avatarSnapshotSha256
		);
	});
});

describe('buildSeasonStandings ranking', () => {
	it('uses total points before all other tie-breaks', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 2), [
			createEntry({
				userId: 'TEST_TOTAL_LEADER',
				userName: 'Z_TEST_TOTAL_LEADER',
				racePoints: 4
			}),
			createEntry({
				userId: 'TEST_TOTAL_CHALLENGER',
				userName: 'A_TEST_TOTAL_CHALLENGER',
				racePoints: 2,
				boldPoints: 1
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				userId: 'TEST_TOTAL_CHALLENGER',
				userName: 'A_TEST_TOTAL_CHALLENGER'
			})
		]);

		expect(standings.individuals[0]).toMatchObject({
			id: 'TEST_TOTAL_LEADER',
			rank: 1,
			totalPoints: 4,
			participation: 1,
			boldPoints: 0
		});
	});

	it('uses participation after total points', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 2), [
			createEntry({
				userId: 'TEST_PARTICIPATION_LEADER',
				userName: 'Z_TEST_PARTICIPATION_LEADER',
				racePoints: 1
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				userId: 'TEST_PARTICIPATION_LEADER',
				userName: 'Z_TEST_PARTICIPATION_LEADER',
				racePoints: 2
			}),
			createEntry({
				userId: 'TEST_PARTICIPATION_CHALLENGER',
				userName: 'A_TEST_PARTICIPATION_CHALLENGER',
				racePoints: 3
			})
		]);

		expect(standings.individuals[0]).toMatchObject({
			id: 'TEST_PARTICIPATION_LEADER',
			rank: 1,
			totalPoints: 3,
			participation: 2
		});
	});

	it('uses bold points before the race histogram', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 1), [
			createEntry({
				userId: 'TEST_BOLD_LEADER',
				userName: 'Z_TEST_BOLD_LEADER',
				racePoints: 2,
				boldPoints: 1
			}),
			createEntry({
				userId: 'TEST_BOLD_CHALLENGER',
				userName: 'A_TEST_BOLD_CHALLENGER',
				racePoints: 3
			})
		]);

		expect(standings.individuals[0]).toMatchObject({
			id: 'TEST_BOLD_LEADER',
			rank: 1,
			totalPoints: 3,
			participation: 1,
			boldPoints: 1
		});
	});

	it.each([6, 5, 4, 3, 2, 1])('uses the %i/6 histogram bucket before lower buckets', (bucket) => {
		const challengerFirstRace = bucket === 1 ? 0 : bucket - 1;
		const challengerSecondRace = bucket === 1 ? 0 : 1;
		const challengerSprintPoints = bucket === 1 ? 1 : 0;

		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 2), [
			createEntry({
				userId: 'TEST_HISTOGRAM_LEADER',
				userName: 'Z_TEST_HISTOGRAM_LEADER',
				racePoints: bucket
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				userId: 'TEST_HISTOGRAM_LEADER',
				userName: 'Z_TEST_HISTOGRAM_LEADER'
			}),
			createEntry({
				userId: 'TEST_HISTOGRAM_CHALLENGER',
				userName: 'A_TEST_HISTOGRAM_CHALLENGER',
				racePoints: challengerFirstRace,
				sprintPoints: challengerSprintPoints
			}),
			createEntry({
				weekendId: TEST_WEEKEND_IDS.b,
				userId: 'TEST_HISTOGRAM_CHALLENGER',
				userName: 'A_TEST_HISTOGRAM_CHALLENGER',
				racePoints: challengerSecondRace
			})
		]);

		const leader = standings.individuals[0];
		const challenger = standings.individuals[1];

		expect(leader).toMatchObject({
			id: 'TEST_HISTOGRAM_LEADER',
			rank: 1,
			totalPoints: bucket,
			participation: 2,
			boldPoints: 0
		});
		expect(challenger).toMatchObject({
			id: 'TEST_HISTOGRAM_CHALLENGER',
			rank: 2,
			totalPoints: bucket,
			participation: 2,
			boldPoints: 0
		});
		expect(leader.histogram[bucket]).toBe(1);
		expect(leader.histogram[0]).toBe(1);
	});

	it('assigns shared competitive ranks and stable display order', () => {
		const standings = buildSeasonStandings(4, TEST_WEEKENDS.slice(0, 1), [
			createEntry({
				userId: 'TEST_SHARED_BETA',
				userName: 'TEST_BETA',
				teamId: 80_002,
				teamName: 'TEST_TEAM_BETA',
				racePoints: 2
			}),
			createEntry({
				userId: 'TEST_SHARED_ALPHA',
				userName: 'TEST_ALPHA',
				teamId: 80_001,
				teamName: 'TEST_TEAM_ALPHA',
				racePoints: 2
			}),
			createEntry({
				userId: 'TEST_SHARED_GAMMA',
				userName: 'TEST_GAMMA',
				teamId: 80_003,
				teamName: 'TEST_TEAM_GAMMA',
				racePoints: 1
			})
		]);

		expect(standings.individuals.map(({ id, rank }) => ({ id, rank }))).toEqual([
			{
				id: 'TEST_SHARED_ALPHA',
				rank: 1
			},
			{
				id: 'TEST_SHARED_BETA',
				rank: 1
			},
			{
				id: 'TEST_SHARED_GAMMA',
				rank: 3
			}
		]);

		expect(
			standings.teams.map(({ id, rank }) => ({
				id,
				rank
			}))
		).toEqual([
			{
				id: 80_001,
				rank: 1
			},
			{
				id: 80_002,
				rank: 1
			},
			{
				id: 80_003,
				rank: 3
			}
		]);
	});
});
