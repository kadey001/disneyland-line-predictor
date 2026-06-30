import { getWaitTimesData } from "@/lib/api-server";
import RideDetailClient from "@/components/ride-detail-client";

export const revalidate = 30; // Refresh server-rendered detail every 30s

interface RideDetailPageProps {
    params: Promise<{ rideId: string }>;
}

export default async function RideDetailPage({ params }: RideDetailPageProps) {
    const { rideId } = await params;
    const initialData = await getWaitTimesData();
    return <RideDetailClient rideId={rideId} initialData={initialData} />;
}
