"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { RideWaitTimeHistory } from "@/lib/types"

const chartData = [
    { rideName: "Space Mountain", waitTime: 30 },
    { rideName: "Pirates of the Caribbean", waitTime: 45 },
    { rideName: "Haunted Mansion", waitTime: 20 },
    { rideName: "It's a Small World", waitTime: 15 },
    { rideName: "Big Thunder Mountain", waitTime: 25 },
]

const chartConfig = {
    waitTime: {
        label: "Wait Time",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

interface WaitTimeChartProps {
    rideWaitTimeHistory: RideWaitTimeHistory
}

export default function WaitTimeChart({ rideWaitTimeHistory }: WaitTimeChartProps) {
    const transformedData = rideWaitTimeHistory.map((_ride) => ({
        rideName: _ride.rideName,
        waitTime: _ride.waitTime,
        snapshotTime: _ride.snapshotTime,
    }));
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Wait Times For {rideWaitTimeHistory[0].rideName}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={transformedData}>
                        <XAxis dataKey="snapshotTime" label={{ value: 'Snapshot Time', position: 'insideBottom', offset: -5 }} tickFormatter={(tick) => new Date(tick).toLocaleTimeString()} />
                        <YAxis label={{ value: 'Wait Time (minutes)', angle: -90, position: 'insideLeft', offset: 10 }} />
                        <Bar dataKey="waitTime" fill="var(--color-waitTime)" radius={4} />
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const time = new Date(data.snapshotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                                return (
                                    <ChartTooltipContent
                                        active={active}
                                        payload={payload}
                                        formatter={() => (
                                            <div>
                                                <div>
                                                    <span><strong>Wait Time:</strong> {data.waitTime} min</span>
                                                </div>
                                                <div>
                                                    <span><strong>Time:</strong> {time}</span>
                                                </div>
                                            </div>
                                        )}
                                    />
                                );
                            }}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
