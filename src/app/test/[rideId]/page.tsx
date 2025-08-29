interface RideDataPageProps {
    params: Promise<{ rideId: string }>
}

export default async function RideDataPage({ params }: RideDataPageProps) {
    const { rideId } = await params

    return (
        <div>
            <h1>{rideId}</h1>
        </div>
    )
}