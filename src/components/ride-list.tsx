"use client";

import type { Ride } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";

interface RideSelectProps {
    rides: Ride[];
    selectedRideId: number;
    onSelect: (rideId: number) => void;
}

export default function RideSelect({ rides, selectedRideId, onSelect }: RideSelectProps) {
    const selectedRide = rides.find(ride => ride.id === selectedRideId);
    return (
        <Select onValueChange={(value) => onSelect(parseInt(value))}>
            <SelectTrigger className="w-[100%]">
                <SelectValue placeholder={selectedRide ? selectedRide.name : "Select a ride"} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {rides.map((ride) => (
                        <SelectItem key={ride.id} value={ride.id.toString()} onClick={() => console.log(ride.id)}>
                            {ride.name}
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
