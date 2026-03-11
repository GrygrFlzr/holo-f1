const DRIVER_FIELDS = [
	'pole_driver_id',
	'p1_driver_id',
	'p2_driver_id',
	'p3_driver_id',
	'p10_driver_id',
	'dotd_driver_id'
] as const;

const SPRINT_FIELDS = ['sprint_pole_driver_id', 'sprint_p1_driver_id'] as const;
const DISTINCT_FIELDS = ['p1_driver_id', 'p2_driver_id', 'p3_driver_id', 'p10_driver_id'] as const;

type DriverFieldName = (typeof DRIVER_FIELDS)[number];
type SprintFieldName = (typeof SPRINT_FIELDS)[number];

interface ParsedSubmission {
	drivers: Record<DriverFieldName, number> & Record<SprintFieldName, number | null>;
	teamId: number;
	boldPrediction: string | null;
}

type ParseResult = { ok: true; data: ParsedSubmission } | { ok: false; error: string };

export function parseSubmissionForm(data: FormData, isSprint: boolean): ParseResult {
	const drivers = {} as ParsedSubmission['drivers'];

	for (const field of DRIVER_FIELDS) {
		const raw = data.get(field);
		if (typeof raw !== 'string' || raw === '') {
			const label = field.replace(/_driver_id$/, '').replace(/_/g, ' ');
			return { ok: false, error: `${label} is required.` };
		}
		const id = Number(raw);
		if (!Number.isInteger(id) || id <= 0) {
			return { ok: false, error: `Invalid selection for ${field}.` };
		}
		drivers[field] = id;
	}

	for (const field of SPRINT_FIELDS) {
		if (isSprint) {
			const raw = data.get(field);
			if (typeof raw !== 'string' || raw === '') {
				const label = field.replace(/_driver_id$/, '').replace(/_/g, ' ');
				return { ok: false, error: `${label} is required.` };
			}
			const id = Number(raw);
			if (!Number.isInteger(id) || id <= 0) {
				return { ok: false, error: `Invalid selection for ${field}.` };
			}
			drivers[field] = id;
		} else {
			drivers[field] = null;
		}
	}

	// P1/P2/P3/P10 must be distinct
	const distinctValues = DISTINCT_FIELDS.map((f) => drivers[f]);
	if (new Set(distinctValues).size !== distinctValues.length) {
		return { ok: false, error: 'P1, P2, P3, and P10 must be different drivers.' };
	}

	const rawTeam = data.get('team_id');
	if (typeof rawTeam !== 'string' || rawTeam === '') {
		return { ok: false, error: 'Team selection is required.' };
	}
	const teamId = Number(rawTeam);
	if (!Number.isInteger(teamId) || teamId <= 0) {
		return { ok: false, error: 'Invalid team selection.' };
	}

	const rawBold = data.get('bold_prediction');
	const boldPrediction = typeof rawBold === 'string' ? rawBold.trim() || null : null;

	return {
		ok: true,
		data: { drivers, teamId, boldPrediction }
	};
}
