<script lang="ts">
	import type { StandingPoint, StandingWeekend } from '$lib/standings';

	interface ProgressionSeries {
		id: string | number;
		name: string;
		color: string | null;
		history: readonly StandingPoint[];
	}

	let {
		title,
		weekends,
		series
	}: {
		title: string;
		weekends: readonly StandingWeekend[];
		series: readonly ProgressionSeries[];
	} = $props();

	const width = 1040;
	const minimumHeight = 420;

	const plotLeft = 56;
	const plotRight = 760;
	const plotTop = 24;
	const plotBottomInset = 96;

	const labelX = 792;
	const connectorX = labelX - 24;
	const labelInset = 16;

	const labelHeadingHeight = 16;
	const labelRowHeight = 16;
	const labelGroupGap = 8;

	interface LabelSeries {
		id: string | number;
		name: string;
		color: string;
	}

	interface PendingLabelGroup {
		points: number;
		anchorY: number;
		series: LabelSeries[];
	}

	interface PackedLabelGroup extends PendingLabelGroup {
		top: number;
		height: number;
		centerY: number;
	}

	interface XTick {
		key: string;
		label: string;
		checkpoint: number;
	}

	function seriesColor(color: string | null): string {
		return color?.trim() || '#ff5148';
	}

	function buildChartHeight(items: readonly ProgressionSeries[]): number {
		const finalPoints = items.flatMap((item) => {
			const last = item.history[item.history.length - 1];

			return last ? [last.cumulativePoints] : [];
		});

		const groupCount = new Set(finalPoints).size;

		const packedHeight =
			groupCount * labelHeadingHeight +
			finalPoints.length * labelRowHeight +
			Math.max(0, groupCount - 1) * labelGroupGap;

		return Math.max(minimumHeight, labelInset * 2 + packedHeight);
	}

	let height = $derived(buildChartHeight(series));
	let plotBottom = $derived(height - plotBottomInset);
	let labelBottom = $derived(height - labelInset);
	let xTickTextY = $derived(plotBottom + 28);

	function checkpointX(checkpoint: number, intervalCount: number): number {
		return plotLeft + (checkpoint / intervalCount) * (plotRight - plotLeft);
	}

	function pointsY(value: number, scaleMaximum: number): number {
		return plotBottom - (value / scaleMaximum) * (plotBottom - plotTop);
	}

	function buildStepPath(
		item: ProgressionSeries,
		intervalCount: number,
		scaleMaximum: number
	): string {
		const commands = [
			`M ${checkpointX(0, intervalCount).toFixed(2)} ${pointsY(0, scaleMaximum).toFixed(2)}`
		];

		item.history.forEach((point, index) => {
			const pointX = checkpointX(index + 1, intervalCount);
			const pointY = pointsY(point.cumulativePoints, scaleMaximum);

			commands.push(`H ${pointX.toFixed(2)}`, `V ${pointY.toFixed(2)}`);
		});

		return commands.join(' ');
	}

	function buildPendingLabelGroups(
		items: readonly ProgressionSeries[],
		scaleMaximum: number
	): PendingLabelGroup[] {
		const groups: PendingLabelGroup[] = [];

		for (const item of items) {
			const last = item.history[item.history.length - 1];

			if (!last) {
				continue;
			}

			const labelSeries: LabelSeries = {
				id: item.id,
				name: item.name,
				color: seriesColor(item.color)
			};

			const existingGroup = groups.find((group) => group.points === last.cumulativePoints);

			if (existingGroup) {
				existingGroup.series.push(labelSeries);
			} else {
				groups.push({
					points: last.cumulativePoints,
					anchorY: pointsY(last.cumulativePoints, scaleMaximum),
					series: [labelSeries]
				});
			}
		}

		return groups;
	}

	function packLabelGroups(groups: readonly PendingLabelGroup[]): PackedLabelGroup[] {
		if (groups.length === 0) {
			return [];
		}

		const dimensions = [...groups]
			.sort((left, right) => left.anchorY - right.anchorY || right.points - left.points)
			.map((group) => ({
				...group,
				height: labelHeadingHeight + group.series.length * labelRowHeight
			}));

		const availableHeight = labelBottom - labelInset;

		const totalHeight = dimensions.reduce((total, group) => total + group.height, 0);

		const gap =
			dimensions.length <= 1
				? 0
				: Math.max(
						0,
						Math.min(labelGroupGap, (availableHeight - totalHeight) / (dimensions.length - 1))
					);

		const placed: PackedLabelGroup[] = dimensions.map((group) => {
			const top = Math.max(
				labelInset,
				Math.min(group.anchorY - group.height / 2, labelBottom - group.height)
			);

			return {
				...group,
				top,
				centerY: 0
			};
		});

		for (let index = 1; index < placed.length; index += 1) {
			const previous = placed[index - 1];

			placed[index].top = Math.max(placed[index].top, previous.top + previous.height + gap);
		}

		const last = placed[placed.length - 1];
		const overflow = last.top + last.height - labelBottom;

		if (overflow > 0) {
			for (const group of placed) {
				group.top -= overflow;
			}
		}

		for (let index = placed.length - 2; index >= 0; index -= 1) {
			const next = placed[index + 1];

			placed[index].top = Math.min(placed[index].top, next.top - placed[index].height - gap);
		}

		const underflow = labelInset - placed[0].top;

		if (underflow > 0) {
			for (const group of placed) {
				group.top += underflow;
			}
		}

		return placed.map((group) => ({
			...group,
			centerY: group.top + group.height / 2
		}));
	}

	function buildYTicks(maximum: number): number[] {
		if (maximum === 0) {
			return [0];
		}

		const roundedTicks = Array.from({ length: 5 }, (_, index) => Math.round((maximum * index) / 4));

		return roundedTicks
			.filter((tick, index) => roundedTicks.indexOf(tick) === index)
			.sort((left, right) => left - right);
	}

	function buildXTicks(items: readonly StandingWeekend[]): XTick[] {
		const tickStep = Math.max(1, Math.ceil(items.length / 8));

		const weekendTicks = items
			.map((weekend, index) => ({
				weekend,
				index
			}))
			.filter(({ index }) => index % tickStep === 0 || index === items.length - 1)
			.map(({ weekend, index }) => ({
				key: `weekend-${weekend.id}`,
				label: weekend.name,
				checkpoint: index + 1
			}));

		return [
			{
				key: 'season-start',
				label: '0',
				checkpoint: 0
			},
			...weekendTicks
		];
	}

	let maximum = $derived(
		Math.max(0, ...series.flatMap((item) => item.history.map((point) => point.cumulativePoints)))
	);

	let scaleMaximum = $derived(Math.max(1, maximum));
	let intervalCount = $derived(Math.max(1, weekends.length));

	let chartSeries = $derived(
		series.map((item) => ({
			series: item,
			color: seriesColor(item.color),
			path: buildStepPath(item, intervalCount, scaleMaximum)
		}))
	);

	let yTicks = $derived(buildYTicks(maximum));
	let xTicks = $derived(buildXTicks(weekends));
	let labelGroups = $derived(packLabelGroups(buildPendingLabelGroups(series, scaleMaximum)));
	let endpointX = $derived(checkpointX(weekends.length, intervalCount));
</script>

<figure>
	<svg viewBox={`0 0 ${width} ${height}`} {width} {height} role="img" aria-label={title}>
		<title>{title}</title>

		<desc>
			All series begin at 0 before the first published weekend and change at each published weekend.
		</desc>

		<g class="guides">
			{#each yTicks as tick (tick)}
				{@const tickY = pointsY(tick, scaleMaximum)}

				<line x1={plotLeft} x2={plotRight} y1={tickY} y2={tickY} />

				<text x={plotLeft - 12} y={tickY} text-anchor="end" dominant-baseline="middle">
					{tick}
				</text>
			{/each}
		</g>

		<line class="axis" x1={plotLeft} x2={plotRight} y1={plotBottom} y2={plotBottom} />

		<g class="weekends">
			{#each xTicks as tick (tick.key)}
				{@const tickX = checkpointX(tick.checkpoint, intervalCount)}

				<line x1={tickX} x2={tickX} y1={plotBottom} y2={plotBottom + 6} />

				<text
					x={tickX}
					y={xTickTextY}
					text-anchor={tick.checkpoint === 0 ? 'middle' : 'end'}
					transform={tick.checkpoint === 0 ? undefined : `rotate(-28 ${tickX} ${xTickTextY})`}
				>
					{tick.label}
				</text>
			{/each}
		</g>

		{#each chartSeries as item (item.series.id)}
			<path class="series-underlay" d={item.path} />
		{/each}

		{#each chartSeries as item (item.series.id)}
			<path class="series-line" d={item.path} stroke={item.color} />

			{#each item.series.history as point, index (point.weekendId)}
				<circle
					cx={checkpointX(index + 1, intervalCount)}
					cy={pointsY(point.cumulativePoints, scaleMaximum)}
					r="3"
					fill={item.color}
				>
					<title>
						{item.series.name}, {point.weekendName}:
						{point.cumulativePoints} cumulative points
					</title>
				</circle>
			{/each}
		{/each}

		{#each labelGroups as group (group.points)}
			<path
				class="group-label-line"
				d={[
					`M ${endpointX} ${group.anchorY}`,
					`H ${connectorX}`,
					`V ${group.centerY}`,
					`H ${labelX - 8}`
				].join(' ')}
			/>

			<circle class="group-endpoint" cx={endpointX} cy={group.anchorY} r="4" />

			<text class="final-score" x={labelX} y={group.top} dominant-baseline="hanging">
				{group.points}
				{group.points === 1 ? ' point' : ' points'}
			</text>

			{#each group.series as item, index (item.id)}
				{@const rowY = group.top + labelHeadingHeight + index * labelRowHeight + labelRowHeight / 2}

				<line
					class="series-key"
					x1={labelX}
					x2={labelX + 12}
					y1={rowY}
					y2={rowY}
					stroke={item.color}
				/>

				<text class="series-label" x={labelX + 20} y={rowY} dominant-baseline="middle">
					{item.name}
				</text>
			{/each}
		{/each}
	</svg>

	<figcaption>
		0 marks the season start; values are cumulative after each published weekend.
	</figcaption>
</figure>

<style>
	figure {
		min-width: 60rem;
		margin: 0;
		padding: var(--space-4);
		background: var(--surface);
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.guides line,
	.axis,
	.weekends line {
		stroke: var(--rule);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.guides text,
	.weekends text {
		fill: var(--ink);
		opacity: 0.68;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
	}

	.series-underlay,
	.series-line {
		fill: none;
		stroke-linecap: square;
		stroke-linejoin: bevel;
		vector-effect: non-scaling-stroke;
	}

	.series-underlay {
		stroke: var(--surface);
		stroke-width: 7;
	}

	.series-line {
		stroke-width: 3;
	}

	circle {
		stroke: var(--ink);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.group-label-line {
		fill: none;
		stroke: var(--rule);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}

	.group-endpoint {
		fill: var(--surface);
		stroke: var(--ink);
		stroke-width: 2;
	}

	.series-key {
		stroke-width: 3;
		vector-effect: non-scaling-stroke;
	}

	.final-score {
		fill: var(--ink);
		font-family: 'Courier New', monospace;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}

	.series-label {
		fill: var(--ink);
		font-family: 'Titillium Web', sans-serif;
		font-size: 14px;
		font-weight: 700;
	}

	figcaption {
		margin-block-start: var(--space-2);
		opacity: 0.68;
		font-size: 0.875rem;
	}
</style>
