import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateToChartAxis(date: Date) {
  return date.toLocaleTimeString("en-US", {
    timeZone: "America/Los_Angeles",
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

const pacificHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  hour12: false,
});

/**
 * Returns the hour (0-23) of the given date in Disneyland's local (Pacific) time,
 * independent of the viewer's/server's timezone.
 */
export function getPacificHour(date: Date): number {
  const hour = Number(pacificHourFormatter.format(date));
  // Some runtimes format midnight as "24" with hour12:false — normalize to 0.
  return hour === 24 ? 0 : hour;
}