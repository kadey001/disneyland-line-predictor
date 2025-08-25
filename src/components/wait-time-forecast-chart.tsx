"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import type { LiveRideDataEntry } from "@/lib/types"
import { formatDateToChartAxis } from "@/lib/utils"

const chartConfig = {
    waitTime: {
        label: "Forecasted Wait Time",
        color: "var(--chart-3)",
    },
    percentage: {
        label: "Forecast Confidence",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig

interface WaitTimeForecastChartProps {
    liveRideData?: LiveRideDataEntry;
}

export default function WaitTimeForecastChart({ liveRideData }: WaitTimeForecastChartProps) {
    // Return null if no live ride data or no forecast data
    if (!liveRideData?.forecast || !liveRideData.forecast.length) {
        return null;
    }

    // Transform the forecast data for the chart
    const chartData = liveRideData.forecast.map(forecast => ({
        time: forecast.time,
        waitTime: forecast.waitTime,
        percentage: forecast.percentage,
        formattedTime: formatDateToChartAxis(new Date(forecast.time))
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Wait Time Forecast for {liveRideData.name}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
                <ChartContainer config={chartConfig} className="min-h-[200px] max-h-[400px] w-full">
                    <LineChart accessibilityLayer data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                            tickFormatter={(tick) => formatDateToChartAxis(new Date(tick))}
                        />
                        <YAxis
                            yAxisId="waitTime"
                            label={{
                                value: 'Wait Time (min)',
                                angle: -90,
                                position: 'insideLeft',
                                offset: 10,
                                style: { textAnchor: 'middle' },
                                className: 'translate-x-2 md:translate-x-0'
                            }}
                        />
                        <YAxis
                            yAxisId="percentage"
                            orientation="right"
                            label={{
                                value: 'Confidence (%)',
                                angle: 90,
                                position: 'insideRight',
                                offset: 10,
                                style: { textAnchor: 'middle' },
                                className: 'translate-x-2 md:translate-x-0'
                            }}
                        />
                        <Line
                            yAxisId="waitTime"
                            type="monotone"
                            dataKey="waitTime"
                            stroke="var(--chart-3)"
                            strokeWidth={3}
                            dot={{ fill: "var(--chart-3)", strokeWidth: 2, r: 4 }}
                            connectNulls={false}
                        />
                        <Line
                            yAxisId="percentage"
                            type="monotone"
                            dataKey="percentage"
                            stroke="var(--chart-4)"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: "var(--chart-4)", strokeWidth: 2, r: 3 }}
                            connectNulls={false}
                        />
                        <ChartTooltip
                            cursor={{ stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 }}
                            content={({ active, payload, label }) => {
                                if (!active || !payload || !payload.length) return null;
                                const data = payload[0].payload;
                                const formattedTime = formatDateToChartAxis(new Date(data.time));

                                return (
                                    <ChartTooltipContent
                                        active={active}
                                        payload={payload}
                                        label={label}
                                        formatter={(value, name) => {
                                            if (name === 'waitTime') {
                                                return [`${value} min`, 'Forecasted Wait Time'];
                                            } else if (name === 'percentage') {
                                                return [`${value}%`, 'Forecast Confidence'];
                                            }
                                            return [value, name];
                                        }}
                                        labelFormatter={() => (
                                            <div>
                                                <span><strong>Time:</strong> {formattedTime}</span>
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
