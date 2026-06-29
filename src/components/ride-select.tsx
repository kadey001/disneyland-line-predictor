"use client";

import { useState, useEffect } from "react";
import type { AttractionAtlasEntry, LiveWaitTimeEntry, ParkAtlasEntry } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { SelectLabel } from "@radix-ui/react-select";

interface RideSelectProps {
    selectedRideId: string;
    onSelect: (rideId: string) => void;
    attractionAtlas: ParkAtlasEntry[];
    liveWaitTime: LiveWaitTimeEntry[];
}

export default function RideSelect({ selectedRideId, onSelect, attractionAtlas, liveWaitTime }: RideSelectProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const californiaAdventureRides = attractionAtlas?.find(park => park.parkName === "Disney California Adventure Park")?.rides || [];
    const disneylandRides = attractionAtlas?.find(park => park.parkName === "Disneyland Park")?.rides || [];

    // Helper function to merge status information from filteredAttractions
    const mergeRideStatus = (attractionAtlas: AttractionAtlasEntry[]) => {
        return attractionAtlas.map(atlasEntry => {
            const liveData = liveWaitTime.find(entry => entry.rideId === atlasEntry.rideId);
            return {
                ...atlasEntry,
                status: liveData?.status || 'UNKNOWN',
                // Use ?? so a 0-minute (walk-on) wait isn't coerced to null and shown as "N/A"
                waitTime: liveData?.waitTime ?? null
            };
        });
    };

    const disneylandRidesWithStatus = mergeRideStatus(disneylandRides);
    const californiaAdventureRidesWithStatus = mergeRideStatus(californiaAdventureRides);

    const isRideOperating = (status?: string) => status === "OPERATING";

    if (!mounted) {
        return (
            <div className="glass rounded-xl shadow-md border border-white/10 dark:border-white/5 h-10 w-full" />
        );
    }

    return (
        <div className="glass rounded-xl shadow-md border border-white/10 dark:border-white/5">
            <Select value={selectedRideId} onValueChange={(value) => onSelect(value)}>
                <SelectTrigger aria-label="Select a Disney ride" className="w-[100%] bg-transparent border-none">
                    <SelectValue placeholder="Select a ride" />
                </SelectTrigger>
                <SelectContent className="glass">
                    <SelectGroup>
                        <SelectLabel>Disneyland Park</SelectLabel>
                        {disneylandRidesWithStatus.map((ride) => (
                            <SelectItem key={ride.rideId} value={ride.rideId} className="flex items-center justify-between gap-2 text-primary focus:bg-white/10 cursor-pointer">
                                <span className="flex items-center gap-2">
                                    {ride.rideName}
                                    <span
                                        className="inline-block w-2 h-2 rounded-full"
                                        style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }}
                                        role="img"
                                        aria-label={isRideOperating(ride.status) ? "Operating" : "Closed"}
                                    />
                                    {isRideOperating(ride.status) && ride.waitTime !== null && ride.waitTime !== undefined
                                        ? `${ride.waitTime} mins`
                                        : "N/A"}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>Disney California Adventure Park</SelectLabel>
                        {californiaAdventureRidesWithStatus.map((ride) => (
                            <SelectItem key={ride.rideId} value={ride.rideId} className="flex items-center justify-between gap-2 text-primary focus:bg-white/10 cursor-pointer">
                                <span className="flex items-center gap-2">
                                    {ride.rideName}
                                    <span
                                        className="inline-block w-2 h-2 rounded-full"
                                        style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }}
                                        role="img"
                                        aria-label={isRideOperating(ride.status) ? "Operating" : "Closed"}
                                    />
                                    {isRideOperating(ride.status) && ride.waitTime !== null && ride.waitTime !== undefined
                                        ? `${ride.waitTime} mins`
                                        : "N/A"}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
