"use client";

import { Button } from "@/components/ui/button";
import type { Ride } from "@/lib/types";

interface RideListProps {
    rides: Ride[];
    selectedRideId: number;
    onSelect: (rideId: number) => void;
}

export default function RideList({ rides, selectedRideId, onSelect }: RideListProps) {
    return (
        <ul className="list-disc pl-5">
            {rides.map((ride) => (
                <li key={ride.id} className="flex items-center gap-2 mb-2">
                    <div className="w-24">
                        <Button
                            size="sm"
                            variant={ride.id === selectedRideId ? "default" : "outline"}
                            onClick={() => onSelect(ride.id)}
                        >
                            {ride.id === selectedRideId ? "Selected" : "Select"}
                        </Button>
                    </div>
                    <strong>{ride.name}:</strong> {ride.wait_time} minutes
                </li>
            ))
            }
        </ul >
    );
}
