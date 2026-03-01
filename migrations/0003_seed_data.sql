-- Driver categories
alter table drivers add column category text not null default 'permanent'
    check (category in ('permanent', 'reserve'));

-- Recreate weekends with composite unique(season, slug) and watchalong_host
-- Recreate submissions to maintain clean FK references
-- Both tables are empty so no data migration needed
drop table submissions;
drop table weekends;

create table weekends (
    id              integer primary key,
    season          integer not null,
    slug            text not null,
    name            text not null,
    lock_time       text not null,
    is_sprint       integer not null default 0,
    scored          integer not null default 0,
    watchalong_host text,
    unique (season, slug)
);

create table submissions (
    user_id         text not null references users(discord_id),
    weekend_id      integer not null references weekends(id),
    pole_driver_id  integer references drivers(id),
    p1_driver_id    integer references drivers(id),
    p2_driver_id    integer references drivers(id),
    p3_driver_id    integer references drivers(id),
    p10_driver_id   integer references drivers(id),
    dotd_driver_id  integer references drivers(id),
    bold_prediction text,
    team_id         integer references teams(id),
    submitted_at    text not null default current_timestamp,
    updated_at      text not null default current_timestamp,
    primary key (user_id, weekend_id)
);

-- Permanent drivers (2026 season)
insert into drivers (code, name) values
    ('GAS', 'Pierre Gasly'),
    ('COL', 'Franco Colapinto'),
    ('ALO', 'Fernando Alonso'),
    ('STR', 'Lance Stroll'),
    ('ALB', 'Alexander Albon'),
    ('SAI', 'Carlos Sainz Jr.'),
    ('BOR', 'Gabriel Bortoleto'),
    ('HUL', 'Nico Hülkenberg'),
    ('PER', 'Sergio Pérez'),
    ('BOT', 'Valtteri Bottas'),
    ('LEC', 'Charles Leclerc'),
    ('HAM', 'Lewis Hamilton'),
    ('OCO', 'Esteban Ocon'),
    ('BEA', 'Oliver Bearman'),
    ('NOR', 'Lando Norris'),
    ('PIA', 'Oscar Piastri'),
    ('ANT', 'Kimi Antonelli'),
    ('RUS', 'George Russell'),
    ('LAW', 'Liam Lawson'),
    ('LIN', 'Arvid Lindblad'),
    ('VER', 'Max Verstappen'),
    ('HAD', 'Isack Hadjar');

-- Reserve drivers
insert into drivers (code, name, category) values
    ('FOR', 'Leonardo Fornaroli', 'reserve'),
    ('OWA', 'Pato O''Ward', 'reserve'),
    ('VES', 'Fred Vesti', 'reserve'),
    ('TSU', 'Yuki Tsunoda', 'reserve'),
    ('GIO', 'Antonio Giovinazzi', 'reserve'),
    ('BRO', 'Luke Browning', 'reserve'),
    ('IWA', 'Ayumu Iwasa', 'reserve'),
    ('CRA', 'Jak Crawford', 'reserve'),
    ('VAN', 'Stoffel Vandoorne', 'reserve'),
    ('DOO', 'Jack Doohan', 'reserve'),
    ('HIR', 'Ryo Hirakawa', 'reserve'),
    ('ARO', 'Paul Aron', 'reserve'),
    ('MAI', 'Kush Maini', 'reserve'),
    ('ZHO', 'Zhou Guanyu', 'reserve');

-- Teams
insert into teams (name, color, image_key, oshi_mark) values
    ('Scuderia KFP', '#ff411c', 'en_myth_kiara', '🐔'),
    ('Amelia''s Driver Bureau', '#f8db92', 'en_myth_ame', '🔎'),
    ('AMG Reine''s [Reidacted]', '#0f53ba', 'id2_reine', '🦚'),
    ('GULF Poyoyo Racing', '#ed3a4f', 'jp2_ayame', '😈'),
    ('Lamy''s Land of Lawnmowers', '#6abadf', 'jp5_lamy', '☃️'),
    ('IRyS'' Stage Racing', '#ff0335', 'en_promise_irys', '💎'),
    ('Shiranui Flare''s Elfriend F1', '#fe3d1c', 'jp3_flare', '🔥'),
    ('Nerissa''s Birdgarage', '#2233fb', 'en_advent_nerissa', '🎼'),
    ('AZKi Pioneer Racing', '#fc3488', 'jp0_azki', '⚒️'),
    ('Mumei''s Sancturacing', '#dcc4b2', 'en_promise_mumei', '🪶'),
    ('Alfa Roneo Racing', '#ffb65d', 'jp5_nene', '🍑🥟'),
    ('Nun-Nun Speedstar Racing', '#266aff', 'jp0_sora', '🐻'),
    ('Shiorin Aramco Racing', '#8b7fad', 'en_advent_shiori', '👁‍🗨'),
    ('Melfriend Formula 1 Team', '#f2c95c', 'id2_anya', '🍂'),
    ('HoloMoms Racing Supremacy', '#88d2ff', 'misc_pekomama', null),
    ('Rindo Chihaya''s Garage', '#37baba', 'devis_flowglow_chihaya', '🎧🔧'),
    ('Operation V7', '#bab9c3', 'id3_zeta', '📜');

-- Australia GP 2026 (GP #1 = odd = KFP hosts)
insert into weekends (season, slug, name, lock_time, is_sprint, watchalong_host) values
    (4, 'australia', 'Australian GP', '2026-03-07T05:00:00Z', 0, 'KFP');
