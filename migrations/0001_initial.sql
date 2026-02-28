create table users (
    discord_id      text primary key,
    display_name    text not null,
    avatar_hash     text,
    created_at      text not null default current_timestamp,
    role            text not null default 'user' check (role in ('user', 'steward', 'admin'))
);

create table teams (
    id          integer primary key,
    name        text not null unique,
    color       text,
    image_key   text not null default 'misc_default',   -- 'misc_pekomama', etc
    oshi_mark   text
);

create table drivers (
    id      integer primary key,
    code    text not null unique,   -- 'VER', 'HAM', etc
    name    text not null
);

create table weekends (
    id          integer primary key,
    season      integer not null,
    slug        text not null unique,   -- '2026-australia
    name        text not null,          -- 'Australian GP'
    lock_time   text not null,          -- UTC ISO 8601
    is_sprint   integer not null default 0,
    scored      integer not null default 0
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
