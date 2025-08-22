"use client"

import { LineChart, Line, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { Ride, RideWaitTimeTrends } from "@/lib/types"

const chartConfig = {
    waitTime: {
        label: "Wait Time",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

interface WaitTimeTrendChartProps {
    ride?: Ride;
    rideWaitTimeTrend?: RideWaitTimeTrends
}

export default function WaitTimeTrendChart({ rideWaitTimeTrend, ride }: WaitTimeTrendChartProps) {
    if (!rideWaitTimeTrend || !ride) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Wait Time Trend For {ride.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[500px] w-full">
                    <LineChart accessibilityLayer data={rideWaitTimeTrend}>
                        <XAxis dataKey="endTime" label={{ value: 'Snapshot Time', position: 'insideBottom', offset: -5 }} tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} />
                        <YAxis label={{ value: 'Trend', angle: -90, position: 'insideLeft', offset: 10 }} />
                        <Line type="step" dataKey="trend" stroke="#2563eb" strokeWidth={3} dot={false} />
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const startTime = new Date(data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                const endTime = new Date(data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
                                                    <span><strong>Trend:</strong> {data.trend}</span>
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
