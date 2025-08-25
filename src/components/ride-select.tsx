"use client";

import type { Ride } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface RideSelectProps {
    rides: Ride[];
    selectedRide?: Ride;
    onSelect: (rideId: number) => void;
}

export default function RideSelect({ rides, selectedRide, onSelect }: RideSelectProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg mt-2">
            <Select onValueChange={(value) => onSelect(parseInt(value))}>
                <SelectTrigger aria-label="Select a Disney ride" className="w-[100%]">
                    <SelectValue placeholder={selectedRide ? (
                        <div className="flex items-center gap-2">
                            {selectedRide.name}
                            <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: selectedRide.is_open ? "green" : "red" }} />
                            {selectedRide.wait_time} mins
                        </div>
                    ) : "Select a ride"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {rides.map((ride) => (
                            <SelectItem key={ride.id} value={ride.id.toString()} onClick={() => console.log(ride.id)}>
                                {ride.name}
                                <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: ride.is_open ? "green" : "red" }} />
                                {ride.wait_time} mins
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
