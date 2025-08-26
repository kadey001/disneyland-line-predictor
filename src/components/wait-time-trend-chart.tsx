"use client"

import { LineChart, Line, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { Ride, RideWaitTimeTrends } from "@/lib/types"
import { formatDateToChartAxis } from "@/lib/utils"

const chartConfig = {
    waitTime: {
        label: "Wait Time",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

interface WaitTimeTrendChartProps {
    selectedRide?: Ride;
    rideWaitTimeTrend?: RideWaitTimeTrends
}

export default function WaitTimeTrendChart({ rideWaitTimeTrend, selectedRide }: WaitTimeTrendChartProps) {
    if (!rideWaitTimeTrend || !selectedRide) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Wait Time Trend For {selectedRide.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
                <ChartContainer config={chartConfig} className="min-h-[200px] max-h-[400px] w-full">
                    <LineChart accessibilityLayer data={rideWaitTimeTrend}>
                        <XAxis dataKey="endTime" label={{ value: 'Snapshot Time', position: 'insideBottom', offset: -5 }} tickFormatter={(tick) => formatDateToChartAxis(new Date(tick))} />
                        <YAxis label={{ value: 'Δ Time', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' }, className: 'translate-x-2 md:translate-x-0' }} />
                        <Line type="step" dataKey="trend" stroke="#2563eb" strokeWidth={3} dot={false} />
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const startTime = formatDateToChartAxis(new Date(data.startTime));
                                const endTime = formatDateToChartAxis(new Date(data.endTime));
                                return (
                                    <ChartTooltipContent
                                        active={active}
                                        payload={payload}
                                        formatter={() => (
                                            <div>
                                                <div>
                                                    <span><strong>Start Time:</strong> {startTime}</span>
                                                </div>
                                                <div>
                                                    <span><strong>End Time:</strong> {endTime}</span>
                                                </div>
                                                <div>
                                                    <span><strong>Δ Time:</strong> {data.trend}</span>
                                                </div>
                                            </div>
                                        )}
                                    />
                                );
                            }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
