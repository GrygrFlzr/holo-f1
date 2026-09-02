create table weekend_results (
	weekend_id integer primary key
		references weekends(id) on delete cascade,

	sprint_pole_driver_id integer references drivers(id),
	sprint_p1_driver_id integer references drivers(id),

	pole_driver_id integer not null references drivers(id),
	p1_driver_id integer not null references drivers(id),
	p2_driver_id integer not null references drivers(id),
	p3_driver_id integer not null references drivers(id),
	p10_driver_id integer not null references drivers(id),
	dotd_driver_id integer not null references drivers(id),

	updated_at text not null default (datetime('now')),

	check (
		(
			sprint_pole_driver_id is null
			and sprint_p1_driver_id is null
		)
		or
		(
			sprint_pole_driver_id is not null
			and sprint_p1_driver_id is not null
		)
	)
);

create table bold_reviews (
	user_id text not null,
	weekend_id integer not null,
	awarded integer not null check (awarded in (0, 1)),
	reviewed_at text not null default (datetime('now')),

	primary key (user_id, weekend_id),

	foreign key (user_id, weekend_id)
		references submissions(user_id, weekend_id)
		on delete cascade
);

create index bold_reviews_weekend_id_idx
	on bold_reviews(weekend_id);
