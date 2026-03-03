/** Anything that can prepare and batch D1 queries — either D1Database or D1DatabaseSession */
export type D1Queryable = Pick<D1Database, 'prepare' | 'batch'>;

/** Map a tuple of types to a tuple of `D1Results` */
type BatchResults<T extends unknown[]> = {
	[K in keyof T]: D1Result<T[K]>;
};

/**
 * Type-safe wrapper around D1's `batch()`.
 *
 * The caller asserts the type tuple matches the statement order
 * — the single assertion lives here, not at every extraction point.
 */
export function typedBatch<T extends unknown[]>(
	db: D1Queryable,
	statements: {
		[K in keyof T]: D1PreparedStatement;
	}
): Promise<BatchResults<T>> {
	return db.batch(statements) as Promise<BatchResults<T>>;
}
