"use client";

import { SelectGroup } from "@radix-ui/react-select";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";

export type TimeFilter = 'full-day' | 'last-8-hours' | 'last-4-hours' | 'last-2-hours' | 'last-hour' | 'last-30-mins'

interface TimeFilterSelectorProps {
    value: TimeFilter;
    onValueChange: (value: TimeFilter) => void;
}

export default function TimeFilterSelector({ value, onValueChange }: TimeFilterSelectorProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg mt-2">
            <Select value={value} onValueChange={onValueChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Time Range</SelectLabel>
                        <SelectItem value="full-day">Full Day</SelectItem>
                        <SelectItem value="last-8-hours">Last 8 Hours</SelectItem>
                        <SelectItem value="last-4-hours">Last 4 Hours</SelectItem>
                        <SelectItem value="last-2-hours">Last 2 Hours</SelectItem>
                        <SelectItem value="last-hour">Last Hour</SelectItem>
                        <SelectItem value="last-30-mins">Last 30 mins</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );
}
