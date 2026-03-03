import type { Driver } from '$lib/server/db/drivers';
import type { Team } from '$lib/server/db/teams';

let drivers: Driver[] | null = null;
let teams: Team[] | null = null;
let expiry = 0;

/** Time to Live in ms */
const TTL = 3_600_000 as const; // 1 hour

export function getCached(): {
	drivers: Driver[];
	teams: Team[];
} | null {
	if (drivers && teams && Date.now() < expiry) {
		return { drivers, teams };
	}
	return null;
}

export function setCache(d: Driver[], t: Team[]): void {
	drivers = d;
	teams = t;
	expiry = Date.now() + TTL;
}

export function invalidateCache() {
	drivers = null;
	teams = null;
	expiry = 0;
}
