import { getWaitTimesData } from "@/lib/api-server";
import HomeClient from "@/components/home-client";

export const revalidate = 30; // Refresh the server-rendered picks/stats every 30s

export default async function Home() {
    const initialData = await getWaitTimesData();
    return <HomeClient initialData={initialData} />;
}
