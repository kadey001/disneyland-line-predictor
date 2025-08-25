"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export type TimeFilter = 'full-day' | 'last-8-hours' | 'last-4-hours' | 'last-2-hours' | 'last-hour' | 'last-30-mins'

interface TimeFilterSelectorProps {
    value: TimeFilter;
    onValueChange: (value: TimeFilter) => void;
}

export default function TimeFilterSelector({ value, onValueChange }: TimeFilterSelectorProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg my-2 p-2 md:p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-2">
                <span className="text-sm font-medium">Time Range:</span>
                <Select value={value} onValueChange={onValueChange}>
                    <SelectTrigger className="w-full md:w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="full-day">Full Day</SelectItem>
                        <SelectItem value="last-8-hours">Last 8 Hours</SelectItem>
                        <SelectItem value="last-4-hours">Last 4 Hours</SelectItem>
                        <SelectItem value="last-2-hours">Last 2 Hours</SelectItem>
                        <SelectItem value="last-hour">Last Hour</SelectItem>
                        <SelectItem value="last-30-mins">Last 30 mins</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
