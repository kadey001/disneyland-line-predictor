"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { Ride, RideWaitTimeHistory } from "@/lib/types"
import { useMemo } from "react"

const chartConfig = {
    waitTime: {
        label: "Wait Time",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

interface WaitTimeChartProps {
    rideWaitTimeHistory: RideWaitTimeHistory
    selectedRide?: Ride
}

export default function WaitTimeChart({ rideWaitTimeHistory, selectedRide }: WaitTimeChartProps) {
    const transformedData = rideWaitTimeHistory.map((_ride) => ({
        rideName: _ride.rideName,
        waitTime: _ride.waitTime,
        snapshotTime: _ride.snapshotTime,
    }));
    // Dot that is red or green based on status
    const statusDotColor = useMemo(() => {
        return selectedRide?.is_open ? "green" : "red";
    }, [selectedRide]);
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Ride: {selectedRide?.name}
                    <br />
                    Status: {selectedRide?.is_open ? "Open" : "Closed"}<span className={`inline-block w-2 h-2 rounded-full ml-2`} style={{ backgroundColor: statusDotColor }} />
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
