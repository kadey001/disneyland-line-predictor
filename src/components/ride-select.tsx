"use client";

import type { AttractionAtlasEntry, LiveWaitTimeEntry, ParkAtlasEntry } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DISNEY_PARKS_ATLAS } from "@/lib/rides";
import { SelectLabel } from "@radix-ui/react-select";
import { useMemo } from "react";

interface RideSelectProps {
    selectedRideId: string;
    onSelect: (rideId: string) => void;
    attractionAtlas: ParkAtlasEntry[];
    liveWaitTime: LiveWaitTimeEntry[];
}

export default function RideSelect({ selectedRideId, onSelect, attractionAtlas, liveWaitTime }: RideSelectProps) {
    // const californiaAdventureRides = DISNEY_PARKS_ATLAS["Disney California Adventure Park"].rides;
    // const disneylandRides = DISNEY_PARKS_ATLAS["Disneyland Park"].rides;
    const californiaAdventureRides = attractionAtlas?.find(park => park.parkName === "Disney California Adventure Park")?.rides || [];
    const disneylandRides = attractionAtlas?.find(park => park.parkName === "Disneyland Park")?.rides || [];

    // Helper function to merge status information from filteredAttractions
    const mergeRideStatus = (attractionAtlas: AttractionAtlasEntry[]) => {
        return attractionAtlas.map(atlasEntry => {
            const liveData = liveWaitTime.find(entry => entry.rideId === atlasEntry.rideId);
            return {
                ...atlasEntry,
                status: liveData?.status || 'UNKNOWN',
                waitTime: liveData?.waitTime || null
            };
        });
    };

    const disneylandRidesWithStatus = mergeRideStatus(disneylandRides);
    const californiaAdventureRidesWithStatus = mergeRideStatus(californiaAdventureRides);

    const isRideOperating = (status?: string) => status === "OPERATING";

    const attractionName = useMemo(() => {
        // find the ride name in the atlas if there is a selectedRideId
        if (selectedRideId) {
            for (const park of attractionAtlas) {
                const attraction = park.rides.find(ride => ride.rideId === selectedRideId);
                if (attraction) {
                    return attraction.rideName;
                }
            }
        }
        return null;
    }, [selectedRideId, attractionAtlas]);

    const selectedLiveData = useMemo(() => {
        return liveWaitTime.find(ride => ride.rideId === selectedRideId);
    }, [selectedRideId, liveWaitTime]);

    return (
        <div className="bg-background border border-gray-200 rounded-lg shadow-lg mt-2">
            <Select onValueChange={(value) => onSelect(value)}>
                <SelectTrigger aria-label="Select a Disney ride" className="w-[100%]">
                    <SelectValue placeholder={attractionName ? (
                        <div className="flex items-center gap-2 text-primary">
                            {attractionName}
                            <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(selectedLiveData?.status) ? "green" : "red" }} />
                            {selectedLiveData?.waitTime ? `${selectedLiveData.waitTime} mins` : "N/A"}
                        </div>
                    ) : "Select a ride"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Disneyland Park</SelectLabel>
                        {disneylandRidesWithStatus.map((ride) => (
                            <SelectItem key={ride.rideId} value={ride.rideId} className="flex items-center justify-between gap-2 text-primary">
                                <div className="flex items-center gap-2">
                                    {ride.rideName}
                                    <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }} />
                                    {ride.waitTime ? `${ride.waitTime} mins` : "N/A"}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                        <SelectLabel>Disney California Adventure Park</SelectLabel>
                        {californiaAdventureRidesWithStatus.map((ride) => (
                            <SelectItem key={ride.rideId} value={ride.rideId} className="flex items-center justify-between gap-2 text-primary">
                                <div className="flex items-center gap-2">
                                    {ride.rideName}
                                    <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }} />
                                    {ride.waitTime ? `${ride.waitTime} mins` : "N/A"}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
