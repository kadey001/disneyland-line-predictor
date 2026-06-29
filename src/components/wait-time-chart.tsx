"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { LiveWaitTimeEntry, RideHistoryEntry } from "@/lib/types"
import { useMemo } from "react"
import { formatDateToChartAxis } from "@/lib/utils"


const chartConfig = {
    waitTime: {
        label: "Wait Time",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface WaitTimeChartProps {
    rideWaitTimeHistory: RideHistoryEntry[];
    selectedRide: LiveWaitTimeEntry | null;
}

export default function WaitTimeChart({ rideWaitTimeHistory, selectedRide }: WaitTimeChartProps) {
    // Dot that is red or green based on status
    const statusDotColor = useMemo(() => {
        return selectedRide?.status === "OPERATING" ? "green" : "red";
    }, [selectedRide]);

    const isOperating = selectedRide?.status === "OPERATING";
    const hasWaitTime = selectedRide?.waitTime !== null && selectedRide?.waitTime !== undefined;
    // Status is authoritative: only show a wait time for an operating ride, so a
    // stale 0 on a closed ride reads "N/A" instead of "0".
    const showWaitTime = isOperating && hasWaitTime;

    const waitTimeBgColor = useMemo(() => {
        if (!isOperating || !hasWaitTime) return "bg-gray-100 dark:bg-gray-700";
        if (selectedRide!.waitTime! <= 30) return "bg-green-100 dark:bg-green-700";
        if (selectedRide!.waitTime! <= 60) return "bg-yellow-100 dark:bg-yellow-700";
        return "bg-red-100 dark:bg-red-800";
    }, [isOperating, hasWaitTime, selectedRide]);

    const transformedData = useMemo(() => {
        if (!rideWaitTimeHistory || !selectedRide) return [];
        return rideWaitTimeHistory.map((_ride) => {
            return {
                rideName: selectedRide.rideName,
                waitTime: _ride.waitTime,
                status: _ride.status,
                snapshotTime: _ride.snapshotTime,
            };
        });
    }, [rideWaitTimeHistory, selectedRide]);

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>
                    Ride: {selectedRide?.rideName}
                    <br />
                    Status: {isOperating ? "Open" : "Closed"}
                    <span
                        className="inline-block w-2 h-2 rounded-full ml-2"
                        style={{ backgroundColor: statusDotColor }}
                        role="img"
                        aria-label={isOperating ? "Operating" : "Closed"}
                    />
                </CardTitle>
                <div className={`${waitTimeBgColor} px-4 py-2 rounded-lg shadow-sm`}>
                    <div className="text-2xl font-bold text-primary text-center">
                        {showWaitTime ? `${selectedRide!.waitTime}` : 'N/A'}
                    </div>
                    <div className="text-xs text-primary text-center">min</div>
                </div>
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
                                                    {data.waitTime !== null && data.waitTime !== undefined ? `${data.waitTime} min` : 'Closed'}
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
