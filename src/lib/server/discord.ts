export function getDiscordDefaultAvatarIndex(discordId: string): number {
	const snowflake = BigInt(discordId);

	if (snowflake < 0n) {
		throw new TypeError('Discord ID must be non-negative.');
	}

	return Number((snowflake >> 22n) % 6n);
}
