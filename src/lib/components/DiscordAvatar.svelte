<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		discordId: string;
		avatarSnapshotSha256: string | null;
		size: number;
		alt?: string;
	}

	let { discordId, avatarSnapshotSha256, size, alt = '' }: Props = $props();

	let defaultAvatarIndex = $derived((BigInt(discordId) >> 22n) % 6n);

	let src = $derived(
		avatarSnapshotSha256
			? resolve('/avatars/[sha256=sha256]/w128.webp', {
					sha256: avatarSnapshotSha256
				})
			: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=${size * 2}`
	);
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
