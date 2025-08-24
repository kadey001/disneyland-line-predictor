import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateToChartAxis(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}