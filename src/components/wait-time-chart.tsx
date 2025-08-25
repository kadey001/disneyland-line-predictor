"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { Ride, RideWaitTimeHistory } from "@/lib/types"
import { useMemo } from "react"
import { formatDateToChartAxis } from "@/lib/utils"


const chartConfig = {
    waitTime: {
        label: "Wait Time",
        color: "var(--chart-2)",
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
            <CardContent className="p-0 md:p-6">
                <ChartContainer config={chartConfig} className="min-h-[200px] max-h-[600px] w-full">
                    <BarChart accessibilityLayer data={transformedData}>
                        <XAxis dataKey="snapshotTime" label={{ value: 'Snapshot Time', position: 'insideBottom', offset: -5 }} tickFormatter={(tick) => formatDateToChartAxis(new Date(tick))} />
                        <YAxis
                            label={{
                                value: 'Wait Time\n',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 10,
                                style: { textAnchor: 'middle' },
                                className: 'translate-x-2 md:translate-x-0'
                            }}
                        />
                        <Bar dataKey="waitTime" fill="var(--color-waitTime)" radius={4} />
                        <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const time = formatDateToChartAxis(new Date(data.snapshotTime));
                                return (
                                    <ChartTooltipContent
                                        active={active}
                                        payload={payload}
                                        formatter={() => (
                                            <div>
                                                <div className="text-sm border-b pb-1 mb-1">
                                                    {data.waitTime} min
                                                </div>
                                                <div>
                                                    <span><strong>Reported At:</strong> {time}</span>
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
