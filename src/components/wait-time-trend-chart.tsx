"use client"

import { useMemo } from "react"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { RideWaitTimeTrends } from "@/lib/types"
import { formatDateToChartAxis } from "@/lib/utils"

const chartConfig = {
    trend: { label: "Change", color: "var(--gold)" },
} satisfies ChartConfig

interface WaitTimeTrendChartProps {
    trends?: RideWaitTimeTrends;
}

/** "How the line is moving" — minute-over-minute delta as a gold line + area. */
export default function WaitTimeTrendChart({ trends }: WaitTimeTrendChartProps) {
    const data = useMemo(
        () => (trends ?? []).map((t) => ({ endTime: new Date(t.endTime).toISOString(), trend: t.trend })),
        [trends],
    );

    if (data.length < 2) return null;

    return (
        <ChartContainer config={chartConfig} className="min-h-[180px] w-full aspect-[3/1]">
            <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <defs>
                    <linearGradient id="goldTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <ReferenceLine y={0} stroke="var(--line)" strokeDasharray="4 7" />
                <XAxis
                    dataKey="endTime"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tick={{ fill: "var(--ink-3)", fontSize: 12 }}
                    tickFormatter={(tick) => formatDateToChartAxis(new Date(tick))}
                />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: "var(--ink-3)", fontSize: 12 }} />
                <Area
                    type="monotone"
                    dataKey="trend"
                    stroke="var(--gold)"
                    strokeWidth={3}
                    fill="url(#goldTrend)"
                    isAnimationActive={false}
                    dot={false}
                />
                <ChartTooltip
                    cursor={{ stroke: "var(--line-2)", strokeWidth: 1 }}
                    content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as { endTime: string; trend: number };
                        const sign = d.trend > 0 ? "+" : "";
                        return (
                            <ChartTooltipContent
                                active={active}
                                payload={payload}
                                formatter={() => (
                                    <div>
                                        <div className="text-sm border-b pb-1 mb-1">{sign}{d.trend} min</div>
                                        <span className="text-xs opacity-80">{formatDateToChartAxis(new Date(d.endTime))}</span>
                                    </div>
                                )}
                            />
                        );
                    }}
                />
            </AreaChart>
        </ChartContainer>
    );
}
