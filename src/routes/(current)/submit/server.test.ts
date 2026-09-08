import type { D1Queryable } from '$lib/server/db/types';
import type { Weekend } from '$lib/server/db/weekends';
import { describe, expect, it } from 'vitest';
import { actions } from './+page.server';

const TODO_TEST_WEEKEND_ID = 9_000_000_000_000_001;
const TODO_TEST_SEASON = 9_000_000_000_000_002;
const TODO_TEST_URL = 'https://todo-test-host.invalid/submit?/clear';

const TODO_TEST_USER: NonNullable<App.Locals['user']> = {
	discord_id: 'TODO_TEST_DISCORD_ID',
	display_name: 'TODO_TEST_DISPLAY_NAME',
	avatar_hash: null,
	avatar_snapshot_sha256: null,
	role: 'user'
};

type ClearActionEvent = Parameters<typeof actions.clear>[0];
type WeekendState = 'open' | 'nonexistent' | 'locked' | 'scored';

interface StatementRecord {
	sql: string;
	bindings: unknown[];
	firstCalls: number;
	runCalls: number;
}

function normalizeSql(sql: string): string {
	return sql.replaceAll(/\s+/g, ' ').trim();
}

function createWeekend(state: WeekendState): Weekend {
	return {
		id: TODO_TEST_WEEKEND_ID,
		season: TODO_TEST_SEASON,
		slug: 'TODO_TEST_WEEKEND',
		name: 'TODO_TEST_WEEKEND',
		lock_time: 'TODO_TEST_LOCK_TIME',
		is_sprint: 0,
		watchalong_host: null,
		scored: state === 'scored' ? 1 : 0
	};
}

function createDatabase(state: WeekendState): {
	db: D1Queryable;
	statements: StatementRecord[];
} {
	const statements: StatementRecord[] = [];

	const db = {
		prepare(sql: string) {
			const record: StatementRecord = {
				sql: normalizeSql(sql),
				bindings: [],
				firstCalls: 0,
				runCalls: 0
			};
			statements.push(record);

			const statement = {
				bind(...bindings: unknown[]) {
					record.bindings = bindings;
					return statement;
				},

				async first() {
					record.firstCalls += 1;

					if (
						!record.sql.includes('from weekends') ||
						record.bindings[0] !== TODO_TEST_WEEKEND_ID ||
						state === 'nonexistent'
					) {
						return null;
					}

					if (state === 'locked' && record.sql.includes("lock_time > datetime('now')")) {
						return null;
					}

					if (state === 'scored' && record.sql.includes('scored = 0')) {
						return null;
					}

					return createWeekend(state);
				},

				async run() {
					record.runCalls += 1;
				}
			};

			return statement as unknown as D1PreparedStatement;
		},

		batch() {
			throw new Error('TODO_TEST_UNEXPECTED_BATCH');
		}
	} as unknown as D1Queryable;

	return { db, statements };
}

function createEvent({
	db,
	user = TODO_TEST_USER,
	weekendId
}: {
	db?: D1Queryable;
	user?: App.Locals['user'];
	weekendId?: string;
}): ClearActionEvent {
	const formData = new FormData();
	if (weekendId !== undefined) {
		formData.set('weekend_id', weekendId);
	}

	const request = new Request(TODO_TEST_URL, {
		method: 'POST',
		body: formData
	});

	return {
		request,
		locals: {
			db,
			user
		}
	} as unknown as ClearActionEvent;
}

describe('submit clear action', () => {
	it('rejects an unauthenticated request', async () => {
		await expect(
			actions.clear(
				createEvent({
					user: null,
					weekendId: String(TODO_TEST_WEEKEND_ID)
				})
			)
		).rejects.toMatchObject({
			status: 401
		});
	});

	it.each([
		{
			label: 'missing',
			weekendId: undefined,
			expectedError: 'Missing weekend ID.'
		},
		{
			label: 'empty',
			weekendId: '',
			expectedError: 'Missing weekend ID.'
		},
		{
			label: 'non-numeric',
			weekendId: 'TODO_TEST_INVALID_WEEKEND_ID',
			expectedError: 'Invalid weekend.'
		},
		{
			label: 'zero',
			weekendId: '0',
			expectedError: 'Invalid weekend.'
		},
		{
			label: 'negative',
			weekendId: '-1',
			expectedError: 'Invalid weekend.'
		},
		{
			label: 'fractional',
			weekendId: '1.5',
			expectedError: 'Invalid weekend.'
		}
	] as const)(
		'rejects a $label weekend ID without querying the database',
		async ({ weekendId, expectedError }) => {
			const { db, statements } = createDatabase('open');

			const result = await actions.clear(
				createEvent({
					db,
					weekendId
				})
			);

			expect(result).toEqual({
				status: 400,
				data: {
					error: expectedError
				}
			});
			expect(statements).toEqual([]);
		}
	);

	it.each([{ state: 'nonexistent' }, { state: 'locked' }, { state: 'scored' }] as const)(
		'does not delete for a $state weekend',
		async ({ state }) => {
			const { db, statements } = createDatabase(state);

			const result = await actions.clear(
				createEvent({
					db,
					weekendId: String(TODO_TEST_WEEKEND_ID)
				})
			);

			expect(result).toEqual({
				status: 400,
				data: {
					error: 'Weekend is locked or does not exist.'
				}
			});
			expect(statements).toHaveLength(1);
			expect(statements[0]).toMatchObject({
				bindings: [TODO_TEST_WEEKEND_ID],
				firstCalls: 1,
				runCalls: 0
			});
			expect(statements.some(({ sql }) => sql.includes('delete from submissions'))).toBe(false);
		}
	);

	it('deletes only the authenticated user submission for the requested open weekend', async () => {
		const { db, statements } = createDatabase('open');

		const result = await actions.clear(
			createEvent({
				db,
				weekendId: String(TODO_TEST_WEEKEND_ID)
			})
		);

		expect(result).toEqual({ cleared: true });

		const weekendStatement = statements.find(({ sql }) => sql.includes('from weekends'));
		expect(weekendStatement?.sql).toContain("lock_time > datetime('now')");
		expect(weekendStatement?.sql).toContain('scored = 0');
		expect(weekendStatement?.bindings).toEqual([TODO_TEST_WEEKEND_ID]);
		expect(weekendStatement?.firstCalls).toBe(1);

		const deleteStatement = statements.find(({ sql }) => sql.includes('delete from submissions'));
		expect(deleteStatement?.sql).toContain('where user_id = ?1 and weekend_id = ?2');
		expect(deleteStatement?.bindings).toEqual([TODO_TEST_USER.discord_id, TODO_TEST_WEEKEND_ID]);
		expect(deleteStatement?.runCalls).toBe(1);
	});
});
