<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		defaultAvatarIndex: number;
		avatarSnapshotSha256: string | null;
		size: number;
		alt?: string;
		bordered?: boolean;
	}

	let {
		defaultAvatarIndex,
		avatarSnapshotSha256,
		size,
		alt = '',
		bordered = true
	}: Props = $props();

	let src = $derived(
		avatarSnapshotSha256
			? resolve('/avatars/[sha256=sha256]/w128.webp', {
					sha256: avatarSnapshotSha256
				})
			: `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=${size * 2}`
	);
</script>

<img class="avatar" class:bordered {src} {alt} width={size} height={size} />

<style>
	.avatar {
		display: block;
		flex: 0 0 auto;
		border-radius: 50%;
	}

	.avatar.bordered {
		border: 1px solid var(--rule, #35505c);
	}
</style>
