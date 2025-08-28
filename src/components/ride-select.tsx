"use client";

import type { LiveRideData, LiveRideDataEntry } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DISNEY_PARKS_ATLAS } from "@/lib/rides";
import { SelectLabel } from "@radix-ui/react-select";

interface RideSelectProps {
    filteredAttractions: LiveRideData;
    rideNames: Record<string, string>;
    selectedRideId?: string;
    onSelect: (rideId: string) => void;
}

export default function RideSelect({ filteredAttractions, rideNames, selectedRideId, onSelect }: RideSelectProps) {
    const selectedRideName = selectedRideId ? rideNames[selectedRideId] : undefined;

    const californiaAdventureRides = DISNEY_PARKS_ATLAS["Disney California Adventure Park"].rides;
    const disneylandRides = DISNEY_PARKS_ATLAS["Disneyland Park"].rides;

    // Helper function to merge status information from filteredAttractions
    const mergeRideStatus = (parkRides: typeof disneylandRides) => {
        return parkRides.map(ride => {
            const liveData = filteredAttractions.find(attraction => attraction.id === ride.id.toString());
            return {
                ...ride,
                status: liveData?.status || 'UNKNOWN',
                waitTime: liveData?.queue?.STANDBY?.waitTime
            };
        });
    };

    const disneylandRidesWithStatus = mergeRideStatus(disneylandRides);
    const californiaAdventureRidesWithStatus = mergeRideStatus(californiaAdventureRides);

    const isRideOperating = (status: string) => status === "OPERATING";


    return (
        <div className="bg-background border border-gray-200 rounded-lg shadow-lg mt-2">
            <Select onValueChange={(value) => onSelect(value)}>
                <SelectTrigger aria-label="Select a Disney ride" className="w-[100%]">
                    <SelectValue placeholder={selectedRideName ? (
                        <div className="flex items-center gap-2 text-primary">
                            {selectedRideName}
                            {(() => {
                                const selectedLiveData = filteredAttractions.find(attraction => attraction.name === selectedRideName);
                                return selectedLiveData ? (
                                    <>
                                        <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(selectedLiveData.status) ? "green" : "red" }} />
                                        {selectedLiveData.queue?.STANDBY.waitTime ? `${selectedLiveData.queue.STANDBY.waitTime} mins` : "N/A"}
                                    </>
                                ) : null;
                            })()}
                        </div>
                    ) : "Select a ride"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {/* {Object.entries(rideNames).map(([rideId, rideName]) => (
                            <SelectItem key={rideId} value={rideId} className="flex items-center justify-between gap-2 text-primary">
                                {rideName}
                            </SelectItem>
                        ))} */}
                        <SelectGroup>
                            <SelectLabel>Disneyland Park</SelectLabel>
                            {disneylandRidesWithStatus.map((ride) => (
                                <SelectItem key={ride.id} value={ride.id.toString()} className="flex items-center justify-between gap-2 text-primary">
                                    <div className="flex items-center gap-2">
                                        {ride.name}
                                        <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }} />
                                        {ride.waitTime ? `${ride.waitTime} mins` : "N/A"}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                        <SelectGroup>
                            <SelectLabel>Disney California Adventure Park</SelectLabel>
                            {californiaAdventureRidesWithStatus.map((ride) => (
                                <SelectItem key={ride.id} value={ride.id.toString()} className="flex items-center justify-between gap-2 text-primary">
                                    <div className="flex items-center gap-2">
                                        {ride.name}
                                        <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }} />
                                        {ride.waitTime ? `${ride.waitTime} mins` : "N/A"}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
