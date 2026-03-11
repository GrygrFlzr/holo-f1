type TimeKey = 'year' | 'month' | 'date' | 'hour' | 'minute' | 'second';
const patterns: Record<TimeKey, string> = {
	year: String.raw`(?<year>\d{4})`,
	month: String.raw`(?<month>(?:0[1-9]|1[012]))`,
	date: String.raw`(?<date>(?:0[1-9]|[12]\d|3[01]))`,
	hour: String.raw`(?<hour>(?:[01]\d|2[0123]))`,
	minute: String.raw`(?<minute>[0-5]\d)`,
	second: String.raw`(?<second>[0-5]\d(?:\.\d{3})?)`
};
const isoTimePattern = new RegExp(
	`^${patterns.year}-${patterns.month}-${patterns.date}T${patterns.hour}:${patterns.minute}:${patterns.second}Z$`
);
const sqliteTimePattern = new RegExp(
	`^${patterns.year}-${patterns.month}-${patterns.date} ${patterns.hour}:${patterns.minute}:${patterns.second}$`
);

/*@__NO_SIDE_EFFECTS__*/
export function parseDateTime(datetimeStr: string): Date | null {
	const isIso = isoTimePattern.test(datetimeStr);
	let maybeDate: Date;
	if (isIso) {
		maybeDate = new Date(datetimeStr);
	} else {
		const match = sqliteTimePattern.exec(datetimeStr);
		if (match === null) return null;
		const { year, month, date, hour, minute, second } = match.groups as Record<TimeKey, string>;
		maybeDate = new Date(`${year}-${month}-${date}T${hour}:${minute}:${second}Z`);
	}
	// block invalid dates like Feb 30
	if (isNaN(maybeDate.getTime())) return null;
	return maybeDate;
}
