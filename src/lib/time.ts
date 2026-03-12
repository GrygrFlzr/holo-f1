type TimeKey = 'yy' | 'mm' | 'dd' | 'hh' | 'ii' | 'ss';
const { raw } = String;
const yearPattern = raw`(?<yy>\d{4})`;
const monthPattern = raw`(?<mm>(?:0[1-9]|1[012]))`;
const datePattern = raw`(?<dd>(?:0[1-9]|[12]\d|3[01]))`;
const hourPattern = raw`(?<hh>(?:[01]\d|2[0123]))`;
const minutePattern = raw`(?<ii>[0-5]\d)`;
const secondPattern = raw`(?<ss>[0-5]\d(?:\.\d{3})?)`;

const isoTimePattern = new RegExp(
	`^${yearPattern}-${monthPattern}-${datePattern}T${hourPattern}:${minutePattern}:${secondPattern}Z$`
);
const sqliteTimePattern = new RegExp(
	`^${yearPattern}-${monthPattern}-${datePattern} ${hourPattern}:${minutePattern}:${secondPattern}$`
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
		const { yy, mm, dd, hh, ii, ss } = match.groups as Record<TimeKey, string>;
		maybeDate = new Date(`${yy}-${mm}-${dd}T${hh}:${ii}:${ss}Z`);
	}
	// block invalid dates like Feb 30
	if (isNaN(maybeDate.getTime())) return null;
	return maybeDate;
}
