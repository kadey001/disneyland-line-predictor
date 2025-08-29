// import { Card, CardContent } from "@/components/ui/card";
// import { getWaitTimes } from "./actions";
// import { calculateRideWaitTimeTrend } from "@/lib/trend-calculator";

export default async function DashboardPage() {
    return null;
    // const { mainAttractions, sortedRideHistory } = await getWaitTimes();

    // const attractionsWithTrend = mainAttractions.map(attraction => {
    //     const trend = calculateRideWaitTimeTrend({ waitTimeHistory: sortedRideHistory, rideName: attraction.name });
    //     return { ...attraction, trend };
    // });

    // const suggestedAttractions = attractionsWithTrend.filter(attraction => attraction.queue?.STANDBY.waitTime !== undefined && attraction.status === "OPERATING").map(attraction => {
    //     if (!attraction?.trend || attraction.trend[attraction.trend.length - 1]?.trend === undefined) return { ...attraction, trend: 'N/A' }
    //     const lastTrendValue = attraction.trend[attraction.trend.length - 1]?.trend;
    //     return {
    //         id: attraction.id,
    //         name: attraction.name,
    //         waitTime: attraction.queue?.STANDBY.waitTime ?? 0,
    //         // Add colors to arrows
    //         trend: lastTrendValue.toString()
    //     };
    // });

    // const predictions = [
    //     { id: 1, name: "Attraction 1", currentWaitTime: 45, predictedWaitTime: 35 },
    //     { id: 2, name: "Attraction 2", currentWaitTime: 50, predictedWaitTime: 40 },
    //     { id: 3, name: "Attraction 3", currentWaitTime: 30, predictedWaitTime: 25 },
    //     { id: 4, name: "Attraction 4", currentWaitTime: 20, predictedWaitTime: 20 },
    //     { id: 5, name: "Attraction 5", currentWaitTime: 15, predictedWaitTime: 15 },
    //     { id: 6, name: "Attraction 6", currentWaitTime: 35, predictedWaitTime: 30 }
    // ];

    // const nonOperationalRides = mainAttractions.filter(attraction => attraction.status === "CLOSED");

    // const getTrendColor = (trend: string) => {
    //     if (trend === 'N/A') return "text-primary";
    //     const trendValue = parseInt(trend);
    //     if (trendValue > 0) return "text-red-500";
    //     if (trendValue < 0) return "text-green-500";
    //     return "text-yellow-500";
    // };

    // const getTrendText = (trend: string) => {
    //     if (trend === 'N/A') return "No recent data";
    //     const trendValue = parseInt(trend);
    //     if (trendValue > 0) return `↑ recently by ${trendValue} mins`;
    //     if (trendValue < 0) return `↓ Decreased recently by ${Math.abs(trendValue)} mins`;
    //     return `→ Stable`;
    // };

    // return (
    //     <div className="space-y-2 p-0 md:p-4 lg:p-8">
    //         {/** Suggested Attractions Grid **/}
    //         <h2 className="text-lg font-semibold text-primary">Suggested Attractions</h2>
    //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    //             {suggestedAttractions.map((attraction) => (
    //                 <Card key={attraction.id} className="bg-background p-4 rounded shadow">
    //                     <CardContent>
    //                         <h2 className="text-lg font-semibold text-primary">{attraction.name}</h2>
    //                         <p className="text-primary">Current Wait Time: {attraction.waitTime} mins</p>
    //                         <p className={`${getTrendColor(attraction.trend)}`}>Trend: {getTrendText(attraction.trend)}</p>
    //                     </CardContent>
    //                 </Card>
    //             ))}
    //         </div>
    //         {/** Predictions **/}
    //         <h2 className="text-lg font-semibold text-primary">Predictions</h2>
    //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    //             {predictions.map((attraction) => (
    //                 <Card key={attraction.id} className="bg-background p-4 rounded shadow">
    //                     <CardContent>
    //                         <h2 className="text-lg font-semibold text-primary">{attraction.name}</h2>
    //                         <p className="text-primary">Current Wait Time: {attraction.currentWaitTime} mins</p>
    //                         <p className="text-primary">Predicted Wait Time (Next 10 mins): {attraction.predictedWaitTime} mins</p>
    //                     </CardContent>
    //                 </Card>
    //             ))}
    //         </div>
    //         {/** Non-Operational Rides **/}
    //         <h2 className="text-lg font-semibold text-primary">Non-Operational Rides</h2>
    //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    //             {/* Map through non-operational rides data */}
    //             {nonOperationalRides.map((attraction) => (
    //                 <Card key={attraction.id} className="bg-background p-4 rounded shadow">
    //                     <CardContent>
    //                         <h2 className="text-lg font-semibold text-primary">{attraction.name}</h2>
    //                     </CardContent>
    //                 </Card>
    //             ))}
    //         </div>
    //     </div>
    // );
}
