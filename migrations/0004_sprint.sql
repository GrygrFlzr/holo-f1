alter table submissions add column sprint_pole_driver_id integer references drivers(id);
alter table submissions add column sprint_p1_driver_id integer references drivers(id);
