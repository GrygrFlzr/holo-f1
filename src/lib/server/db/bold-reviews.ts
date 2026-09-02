import type { D1Queryable } from '$lib/server/db/types';

export interface BoldReview {
	user_id: string;
	weekend_id: number;
	awarded: 0 | 1;
	reviewed_at: string;
}

export interface BoldReviewInput {
	user_id: string;
	awarded: 0 | 1;
}

export async function getBoldReviewsForWeekend(
	db: D1Queryable,
	weekendId: number
): Promise<BoldReview[]> {
	const { results } = await db
		.prepare(
			`
			select
				user_id,
				weekend_id,
				awarded,
				reviewed_at
			from bold_reviews
			where weekend_id = ?
			order by user_id asc
			`
		)
		.bind(weekendId)
		.all<BoldReview>();

	return results;
}

export async function upsertBoldReviews(
	db: D1Queryable,
	weekendId: number,
	reviews: BoldReviewInput[]
): Promise<void> {
	if (reviews.length === 0) {
		return;
	}

	await db.batch(
		reviews.map((review) =>
			db
				.prepare(
					`
					insert into bold_reviews (
						user_id,
						weekend_id,
						awarded
					)
					values (?1, ?2, ?3)
					on conflict (user_id, weekend_id)
					do update set
						awarded = excluded.awarded,
						reviewed_at = datetime('now')
					`
				)
				.bind(review.user_id, weekendId, review.awarded)
		)
	);
}
