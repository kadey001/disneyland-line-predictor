import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { RideWaitTimeHistory } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateToChartAxis(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function filterTodaysRideHistory(rideHistory: RideWaitTimeHistory): RideWaitTimeHistory {
  const now = new Date();

  // Get current PST date
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));

  // Create opening time (8:00 AM PST) for today
  const openingTimePST = new Date(pstDate);
  openingTimePST.setHours(8, 0, 0, 0);

  // Create closing time (midnight PST) for tomorrow
  const closingTimePST = new Date(pstDate);
  closingTimePST.setDate(closingTimePST.getDate() + 1);
  closingTimePST.setHours(0, 0, 0, 0);

  return rideHistory.filter(entry => {
    const entryDate = new Date(entry.snapshotTime);
    const entryDatePST = new Date(entryDate.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    return entryDatePST >= openingTimePST && entryDatePST < closingTimePST;
  });
}