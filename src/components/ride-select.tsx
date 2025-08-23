"use client";

import type { Ride } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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
                <SelectValue placeholder={selectedRide ? (
                    <div className="flex items-center gap-2">
                        {selectedRide.name}
                        <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: selectedRide.is_open ? "green" : "red" }} />
                    </div>
                ) : "Select a ride"} />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    {rides.map((ride) => (
                        <SelectItem key={ride.id} value={ride.id.toString()} onClick={() => console.log(ride.id)}>
                            {ride.name}
                            <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: ride.is_open ? "green" : "red" }} />
                        </SelectItem>
                    ))}
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
