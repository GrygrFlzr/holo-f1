import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DISCORD_CLIENT_ID: {},
	DISCORD_CLIENT_SECRET: {},
	AUTH_SECRET: {
		description: 'Used for cookie signing.\n\nGenerate with `openssl rand -hex 32`'
	}
});
