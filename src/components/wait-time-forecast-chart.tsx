"use client"

import { useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatDateToChartAxis } from "@/lib/utils"

const chartConfig = {
    waitTime: { label: "Forecast", color: "var(--gold)" },
} satisfies ChartConfig

export interface ForecastPoint {
    percentage: number;
    waitTime: number;
    time: string;
}

interface WaitTimeForecastChartProps {
    forecast?: ForecastPoint[];
}

/** "Predicted wait ahead" — model forecast line (bonus; not in the source design). */
export default function WaitTimeForecastChart({ forecast }: WaitTimeForecastChartProps) {
    const data = useMemo(
        () => (forecast ?? []).map((f) => ({ time: f.time, waitTime: f.waitTime, percentage: f.percentage })),
        [forecast],
    );

    if (data.length < 2) return null;

    return (
        <ChartContainer config={chartConfig} className="min-h-[180px] w-full aspect-[3/1]">
            <LineChart accessibilityLayer data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--grid)" />
                <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={28}
                    tick={{ fill: "var(--ink-3)", fontSize: 12 }}
                    tickFormatter={(tick) => formatDateToChartAxis(new Date(tick))}
                />
                <YAxis tickLine={false} axisLine={false} width={44} tick={{ fill: "var(--ink-3)", fontSize: 12 }} />
                <Line
                    type="monotone"
                    dataKey="waitTime"
                    stroke="var(--gold)"
                    strokeWidth={3}
                    dot={{ fill: "var(--gold)", r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                />
                <ChartTooltip
                    cursor={{ stroke: "var(--line-2)", strokeWidth: 1 }}
                    content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload as ForecastPoint;
                        return (
                            <ChartTooltipContent
                                active={active}
                                payload={payload}
                                formatter={() => (
                                    <div>
                                        <div className="text-sm border-b pb-1 mb-1">{d.waitTime} min</div>
                                        <span className="text-xs opacity-80">{formatDateToChartAxis(new Date(d.time))} · {d.percentage}% confidence</span>
                                    </div>
                                )}
                            />
                        );
                    }}
                />
            </LineChart>
        </ChartContainer>
    );
}
