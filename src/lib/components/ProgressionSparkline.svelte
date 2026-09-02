<script lang="ts">
	import type { StandingPoint } from '$lib/standings';

	let {
		history,
		label
	}: {
		history: readonly StandingPoint[];
		label: string;
	} = $props();

	const width = 160;
	const height = 40;
	const padding = 4;

	let model = $derived.by(() => {
		const maximum = Math.max(0, ...history.map((point) => point.cumulativePoints));
		const intervalCount = Math.max(1, history.length);

		const x = (checkpoint: number): number =>
			padding + (checkpoint / intervalCount) * (width - padding * 2);

		const y = (value: number): number => {
			if (maximum === 0) {
				return height - padding;
			}

			return height - padding - (value / maximum) * (height - padding * 2);
		};

		const commands = [`M ${x(0).toFixed(2)} ${y(0).toFixed(2)}`];

		history.forEach((point, index) => {
			const pointX = x(index + 1);
			const pointY = y(point.cumulativePoints);

			commands.push(`H ${pointX.toFixed(2)}`, `V ${pointY.toFixed(2)}`);
		});

		const last = history[history.length - 1];

		return {
			path: commands.join(' '),
			lastX: last ? x(history.length) : 0,
			lastY: last ? y(last.cumulativePoints) : 0
		};
	});
</script>

{#if history.length > 0}
	<svg viewBox={`0 0 ${width} ${height}`} {width} {height} role="img" aria-label={label}>
		<title>{label}</title>

		<path class="line-underlay" d={model.path} />
		<path class="line" d={model.path} />

		<circle cx={model.lastX} cy={model.lastY} r="3" />
	</svg>
{/if}

<style>
	svg {
		display: block;
		width: 10rem;
		max-width: 100%;
		height: 2.5rem;
		overflow: visible;
	}

	path {
		fill: none;
		stroke-linecap: square;
		stroke-linejoin: bevel;
		vector-effect: non-scaling-stroke;
	}

	.line-underlay {
		stroke: var(--surface);
		stroke-width: 5;
	}

	.line {
		stroke: currentColor;
		stroke-width: 2;
	}

	circle {
		fill: currentColor;
		stroke: var(--ink);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
</style>
