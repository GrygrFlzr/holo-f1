import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from 'vitest';

const execFileAsync = promisify(execFile);

const repositoryRoot = resolve(import.meta.dirname, '..');
const databaseName = 'holo-f1';

async function runWrangler(args: string[]): Promise<void> {
	await execFileAsync('pnpm', ['exec', 'wrangler', ...args], {
		cwd: repositoryRoot,
		encoding: 'utf8',
		env: {
			...process.env,
			CI: 'true',
			NO_COLOR: '1'
		}
	});
}

function buildConstraintFixture(): string {
	const validDigest = '0123456789abcdef'.repeat(4);
	const shortDigest = validDigest.slice(0, -1);
	const longDigest = `${validDigest}0`;
	const uppercaseDigest = validDigest.toUpperCase();
	const nonHexDigest = `${validDigest.slice(0, -1)}g`;

	/*
	 * This BLOB is deliberately 64 bytes long. It satisfies the
	 * length constraint and can therefore be rejected only by the
	 * explicit storage-class constraint.
	 */
	const sixtyFourByteBlob = '00'.repeat(64);

	return `
insert or ignore into users (
	discord_id,
	discord_name,
	avatar_snapshot_sha256
) values
	(
		'TEST_AVATAR_SNAPSHOT_NULL',
		'TEST_AVATAR_SNAPSHOT_NULL',
		null
	),
	(
		'TEST_AVATAR_SNAPSHOT_LOWERCASE',
		'TEST_AVATAR_SNAPSHOT_LOWERCASE',
		'${validDigest}'
	),
	(
		'TEST_AVATAR_SNAPSHOT_SHORT',
		'TEST_AVATAR_SNAPSHOT_SHORT',
		'${shortDigest}'
	),
	(
		'TEST_AVATAR_SNAPSHOT_LONG',
		'TEST_AVATAR_SNAPSHOT_LONG',
		'${longDigest}'
	),
	(
		'TEST_AVATAR_SNAPSHOT_UPPERCASE',
		'TEST_AVATAR_SNAPSHOT_UPPERCASE',
		'${uppercaseDigest}'
	),
	(
		'TEST_AVATAR_SNAPSHOT_NON_HEX',
		'TEST_AVATAR_SNAPSHOT_NON_HEX',
		'${nonHexDigest}'
	),
	(
		'TEST_AVATAR_SNAPSHOT_BLOB',
		'TEST_AVATAR_SNAPSHOT_BLOB',
		x'${sixtyFourByteBlob}'
	);

create table avatar_snapshot_constraint_assertion (
	passed integer not null
	check (passed = 1)
);

insert into avatar_snapshot_constraint_assertion (
	passed
)
select
	case
		when
			(
				select count(*)
				from users
				where discord_id in (
					'TEST_AVATAR_SNAPSHOT_NULL',
					'TEST_AVATAR_SNAPSHOT_LOWERCASE',
					'TEST_AVATAR_SNAPSHOT_SHORT',
					'TEST_AVATAR_SNAPSHOT_LONG',
					'TEST_AVATAR_SNAPSHOT_UPPERCASE',
					'TEST_AVATAR_SNAPSHOT_NON_HEX',
					'TEST_AVATAR_SNAPSHOT_BLOB'
				)
			) = 2
			and exists (
				select 1
					from users
					where
						discord_id =
							'TEST_AVATAR_SNAPSHOT_NULL'
						and avatar_snapshot_sha256 is null
			)
			and exists (
				select 1
					from users
					where
						discord_id =
							'TEST_AVATAR_SNAPSHOT_LOWERCASE'
						and avatar_snapshot_sha256 =
							'${validDigest}'
						and typeof(
							avatar_snapshot_sha256
						) = 'text'
			)
		then 1
		else 0
	end;
`;
}

test('avatar snapshot digest accepts only null or 64-character lowercase hexadecimal text', async () => {
	const persistencePath = await mkdtemp(join(tmpdir(), 'holo-f1-avatar-snapshot-schema-'));

	const fixturePath = join(persistencePath, 'avatar-snapshot-constraint.sql');

	try {
		await runWrangler([
			'd1',
			'migrations',
			'apply',
			databaseName,
			'--local',
			'--persist-to',
			persistencePath
		]);

		await writeFile(fixturePath, buildConstraintFixture(), 'utf8');

		await expect(
			runWrangler([
				'd1',
				'execute',
				databaseName,
				'--local',
				'--persist-to',
				persistencePath,
				'--file',
				fixturePath
			])
		).resolves.toBeUndefined();
	} finally {
		await rm(persistencePath, {
			recursive: true,
			force: true
		});
	}
}, 60_000);
