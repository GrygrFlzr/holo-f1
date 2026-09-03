alter table users
add column avatar_snapshot_sha256 text
constraint users_avatar_snapshot_sha256_valid
check (
	avatar_snapshot_sha256 is null
	or (
		typeof(avatar_snapshot_sha256) = 'text'
		and length(avatar_snapshot_sha256) = 64
		and avatar_snapshot_sha256 not glob '*[^0-9a-f]*'
	)
);
