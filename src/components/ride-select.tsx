"use client";

import type { LiveRideData, LiveRideDataEntry } from "@/lib/types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface RideSelectProps {
    mainAttractions: LiveRideData;
    selectedLiveRideData?: LiveRideDataEntry;
    onSelect: (rideName: string) => void;
}

export default function RideSelect({ mainAttractions, selectedLiveRideData, onSelect }: RideSelectProps) {
    const isRideOperating = (status: string) => status === "OPERATING";

    return (
        <div className="bg-background border border-gray-200 rounded-lg shadow-lg mt-2">
            <Select onValueChange={(value) => onSelect(value)}>
                <SelectTrigger aria-label="Select a Disney ride" className="w-[100%]">
                    <SelectValue placeholder={selectedLiveRideData ? (
                        <div className="flex items-center gap-2 text-primary">
                            {selectedLiveRideData.name}
                            <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(selectedLiveRideData.status) ? "green" : "red" }} />
                            {selectedLiveRideData.queue?.STANDBY.waitTime ? `${selectedLiveRideData.queue.STANDBY.waitTime} mins` : "N/A"}
                        </div>
                    ) : "Select a ride"} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {mainAttractions.map((ride) => (
                            <SelectItem key={ride.id} value={ride.name} className="flex items-center justify-between gap-2 text-primary">
                                {ride.name}
                                <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: isRideOperating(ride.status) ? "green" : "red" }} />
                                {ride.queue?.STANDBY.waitTime ? `${ride.queue.STANDBY.waitTime} mins` : "N/A"}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
