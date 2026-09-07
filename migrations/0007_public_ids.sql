alter table users
add column public_id text
constraint users_public_id_valid
check (
	public_id is null
	or (
		typeof(public_id) = 'text'
		and length(public_id) = 36
		and substr(public_id, 9, 1) = '-'
		and substr(public_id, 14, 1) = '-'
		and substr(public_id, 19, 1) = '-'
		and substr(public_id, 24, 1) = '-'
		and length(replace(public_id, '-', '')) = 32
		and replace(public_id, '-', '') not glob '*[^0-9a-f]*'
		and substr(public_id, 15, 1) = '4'
		and substr(public_id, 20, 1) glob '[89ab]'
	)
);

create unique index users_public_id_unique
	on users(public_id)
	where public_id is not null;
