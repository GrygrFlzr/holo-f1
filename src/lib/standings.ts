export interface StandingWeekend {
	id: number;
	name: string;
	lockTime: string;
	isSprint: boolean;
}

export interface StandingPoint {
	weekendId: number;
	weekendName: string;
	roundPoints: number;
	cumulativePoints: number;
}

export type RaceResultHistogram = readonly [number, number, number, number, number, number, number];

type MutableRaceResultHistogram = [number, number, number, number, number, number, number];

interface RankingMetrics {
	totalPoints: number;
	participation: number;
	boldPoints: number;
	histogram: RaceResultHistogram;
}

export interface IndividualStanding extends RankingMetrics {
	id: string;
	name: string;
	avatarSnapshotSha256: string | null;
	rank: number;
	history: StandingPoint[];
}

export interface TeamStanding extends RankingMetrics {
	id: number;
	name: string;
	color: string | null;
	rank: number;
	history: StandingPoint[];
}

export interface SeasonStandings {
	season: number;
	weekends: StandingWeekend[];
	individuals: IndividualStanding[];
	teams: TeamStanding[];
}

export interface ScoredStandingEntry {
	weekendId: number;
	userId: string;
	userName: string;
	userAvatarSnapshotSha256: string | null;
	teamId: number;
	teamName: string;
	teamColor: string | null;
	racePoints: number;
	sprintPoints: number;
	boldPoints: 0 | 1;
	totalPoints: number;
}

interface BaseAccumulator {
	totalPoints: number;
	participation: number;
	boldPoints: number;
	histogram: MutableRaceResultHistogram;
	roundPoints: Map<number, number>;
}

interface IndividualAccumulator extends BaseAccumulator {
	id: string;
	name: string;
	avatarSnapshotSha256: string | null;
}

interface TeamAccumulator extends BaseAccumulator {
	id: number;
	name: string;
	color: string | null;
}

function createHistogram(): MutableRaceResultHistogram {
	return [0, 0, 0, 0, 0, 0, 0];
}

function createBaseAccumulator(): BaseAccumulator {
	return {
		totalPoints: 0,
		participation: 0,
		boldPoints: 0,
		histogram: createHistogram(),
		roundPoints: new Map()
	};
}

function addEntry(accumulator: BaseAccumulator, entry: ScoredStandingEntry): void {
	accumulator.totalPoints += entry.totalPoints;
	accumulator.participation += 1;
	accumulator.boldPoints += entry.boldPoints;

	accumulator.histogram[entry.racePoints] = (accumulator.histogram[entry.racePoints] ?? 0) + 1;

	accumulator.roundPoints.set(
		entry.weekendId,
		(accumulator.roundPoints.get(entry.weekendId) ?? 0) + entry.totalPoints
	);
}

function buildHistory(
	weekends: readonly StandingWeekend[],
	roundPoints: ReadonlyMap<number, number>
): StandingPoint[] {
	let cumulativePoints = 0;

	return weekends.map((weekend) => {
		const weekendPoints = roundPoints.get(weekend.id) ?? 0;
		cumulativePoints += weekendPoints;

		return {
			weekendId: weekend.id,
			weekendName: weekend.name,
			roundPoints: weekendPoints,
			cumulativePoints
		};
	});
}

function comparePerformance(left: RankingMetrics, right: RankingMetrics): number {
	let result = right.totalPoints - left.totalPoints;

	if (result !== 0) {
		return result;
	}

	result = right.participation - left.participation;

	if (result !== 0) {
		return result;
	}

	result = right.boldPoints - left.boldPoints;

	if (result !== 0) {
		return result;
	}

	for (let racePoints = 6; racePoints >= 0; racePoints -= 1) {
		result = (right.histogram[racePoints] ?? 0) - (left.histogram[racePoints] ?? 0);

		if (result !== 0) {
			return result;
		}
	}

	return 0;
}

function rankStandings<
	T extends RankingMetrics & {
		id: string | number;
		name: string;
	}
>(standings: T[]): Array<T & { rank: number }> {
	const sorted = [...standings].sort((left, right) => {
		const performance = comparePerformance(left, right);

		if (performance !== 0) {
			return performance;
		}

		const name = left.name.localeCompare(right.name, 'en');

		if (name !== 0) {
			return name;
		}

		return String(left.id).localeCompare(String(right.id), 'en');
	});

	let currentRank = 0;

	return sorted.map((standing, index) => {
		const previous = sorted[index - 1];

		if (!previous || comparePerformance(previous, standing) !== 0) {
			currentRank = index + 1;
		}

		return {
			...standing,
			rank: currentRank
		};
	});
}

export function buildSeasonStandings(
	season: number,
	weekends: StandingWeekend[],
	entries: ScoredStandingEntry[]
): SeasonStandings {
	const individualsById = new Map<string, IndividualAccumulator>();
	const teamsById = new Map<number, TeamAccumulator>();

	for (const entry of entries) {
		let individual = individualsById.get(entry.userId);

		if (!individual) {
			individual = {
				...createBaseAccumulator(),
				id: entry.userId,
				name: entry.userName,
				avatarSnapshotSha256: entry.userAvatarSnapshotSha256
			};

			individualsById.set(entry.userId, individual);
		}

		addEntry(individual, entry);

		let team = teamsById.get(entry.teamId);

		if (!team) {
			team = {
				...createBaseAccumulator(),
				id: entry.teamId,
				name: entry.teamName,
				color: entry.teamColor
			};

			teamsById.set(entry.teamId, team);
		}

		addEntry(team, entry);
	}

	const individuals: IndividualStanding[] = rankStandings(
		[...individualsById.values()].map((individual) => ({
			id: individual.id,
			name: individual.name,
			avatarSnapshotSha256: individual.avatarSnapshotSha256,
			totalPoints: individual.totalPoints,
			participation: individual.participation,
			boldPoints: individual.boldPoints,
			histogram: individual.histogram,
			history: buildHistory(weekends, individual.roundPoints)
		}))
	);

	const teams: TeamStanding[] = rankStandings(
		[...teamsById.values()].map((team) => ({
			id: team.id,
			name: team.name,
			color: team.color,
			totalPoints: team.totalPoints,
			participation: team.participation,
			boldPoints: team.boldPoints,
			histogram: team.histogram,
			history: buildHistory(weekends, team.roundPoints)
		}))
	);

	return {
		season,
		weekends,
		individuals,
		teams
	};
}
