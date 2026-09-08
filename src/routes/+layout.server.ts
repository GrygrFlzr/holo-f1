import { error } from '@sveltejs/kit';
import { getDiscordDefaultAvatarIndex } from '$lib/server/discord';
import { isPublicId } from '$lib/server/public-id';
import type { LayoutServerLoad } from './$types';

export const load = (({ locals }) => {
	const user = locals.user;

	if (!user) {
		return {
			user: null
		};
	}

	if (!isPublicId(user.public_id)) {
		error(500, 'Public ID not assigned.');
	}

	return {
		user: {
			public_id: user.public_id,
			display_name: user.display_name,
			avatar_snapshot_sha256: user.avatar_snapshot_sha256,
			default_avatar_index: getDiscordDefaultAvatarIndex(user.discord_id)
		}
	};
}) satisfies LayoutServerLoad;
