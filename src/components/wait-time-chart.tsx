"use client"

import { useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { RideHistoryEntry } from "@/lib/types"
import { formatDateToChartAxis } from "@/lib/utils"
import { waitColor } from "@/lib/wait-format"

const chartConfig = {
    waitTime: { label: "Wait Time", color: "var(--gold)" },
} satisfies ChartConfig

interface WaitTimeChartProps {
    history: RideHistoryEntry[];
}

/** "Wait time through the day" — bars colored by wait level. */
export default function WaitTimeChart({ history }: WaitTimeChartProps) {
    const data = useMemo(
        () => (history ?? []).map((h) => ({ snapshotTime: h.snapshotTime, waitTime: h.waitTime })),
        [history],
    );

    if (data.length === 0) return null;

    return (
        <ChartContainer config={chartConfig} className="min-h-[220px] w-full aspect-[2.3/1]">
            <BarChart accessibilityLayer data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis
                    dataKey="snapshotTime"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tick={{ fill: "var(--ink-3)", fontSize: 12 }}
                    tickFormatter={(tick) => formatDateToChartAxis(new Date(tick))}
                />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: "var(--ink-3)", fontSize: 12 }} />
                <Bar dataKey="waitTime" radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive={false}>
                    {data.map((d, i) => (
                        <Cell key={i} fill={waitColor(d.waitTime)} />
                    ))}
                </Bar>
                <ChartTooltip
                    cursor={false}
                    content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as { waitTime: number | null; snapshotTime: string };
                        return (
                            <ChartTooltipContent
                                active={active}
                                payload={payload}
                                formatter={() => (
                                    <div>
                                        <div className="text-sm border-b pb-1 mb-1">
                                            {d.waitTime !== null && d.waitTime !== undefined ? `${d.waitTime} min` : "Closed"}
                                        </div>
                                        <span className="text-xs opacity-80">{formatDateToChartAxis(new Date(d.snapshotTime))}</span>
                                    </div>
                                )}
                            />
                        );
                    }}
                />
            </BarChart>
        </ChartContainer>
    );
}
