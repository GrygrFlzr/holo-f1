<script lang="ts">
	interface Props {
		discordId: string;
		avatarHash: string | null;
		size: number;
		alt?: string;
	}

	let { discordId, avatarHash, size, alt = '' }: Props = $props();

	let avatarBase = $derived(
		avatarHash
			? `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.webp`
			: `https://cdn.discordapp.com/embed/avatars/${(BigInt(discordId) >> 22n) % 6n}.png`
	);

	let src = $derived(`${avatarBase}?size=${size * 2}`);
</script>

<img class="avatar" {src} {alt} width={size} height={size} />

<style>
	.avatar {
		display: block;
		flex: 0 0 auto;
		border: 1px solid var(--rule, #35505c);
		border-radius: 50%;
	}
</style>
