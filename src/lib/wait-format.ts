import type { RideHistoryEntry } from "./types";
import { formatDateToChartAxis } from "./utils";

/**
 * Wait-time presentation helpers shared by the home, grid, and detail screens.
 * Colors are returned as CSS custom-property references so they follow the
 * active night/day theme. Thresholds match the Claude Design source:
 *   <= 20 min  -> light (open)
 *   <= 45 min  -> moderate
 *    > 45 min  -> busy
 */

export function waitColor(v: number | null | undefined): string {
    if (v == null) return "var(--down)";
    if (v <= 20) return "var(--open)";
    if (v <= 45) return "var(--mod)";
    return "var(--busy)";
}

export function isOperating(status?: string | null): boolean {
    return status === "OPERATING";
}

export interface StatusMeta {
    isOpen: boolean;
    label: string;
    color: string;
    bg: string;
}

/** Compact status pill metadata used on cards and the detail header. */
export function statusMeta(status: string | undefined | null, waitTime: number | null): StatusMeta {
    const open = isOperating(status) && waitTime !== null && waitTime !== undefined;
    if (isOperating(status)) {
        return { isOpen: open, label: "Open", color: "var(--open)", bg: "rgba(99,214,166,0.14)" };
    }
    // Real data is effectively OPERATING vs not; treat everything else as closed/down.
    return { isOpen: false, label: "Closed", color: "var(--down)", bg: "rgba(128,148,179,0.14)" };
}

/** Big number shown on a card: the wait, or an em-dash when unavailable. */
export function waitLabel(status: string | undefined | null, waitTime: number | null): string {
    if (!isOperating(status) || waitTime === null || waitTime === undefined) return "—";
    return String(waitTime);
}

/** Non-null wait values from history, oldest→newest. */
function numericValues(history: RideHistoryEntry[]): { val: number; time: string }[] {
    return (history ?? [])
        .filter((h) => h.waitTime !== null && h.waitTime !== undefined)
        .map((h) => ({ val: h.waitTime as number, time: h.snapshotTime }));
}

export interface RideStats {
    hasData: boolean;
    current: number;
    avg: number;
    peak: number;
    peakTime: string;
    best: number;
    bestTime: string;
}

/** Stat-card figures (current / today's average / peak / best window) from history. */
export function rideStats(history: RideHistoryEntry[]): RideStats {
    const pts = numericValues(history);
    if (pts.length < 1) {
        return { hasData: false, current: 0, avg: 0, peak: 0, peakTime: "", best: 0, bestTime: "" };
    }
    const vals = pts.map((p) => p.val);
    const current = vals[vals.length - 1];
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    let peak = pts[0];
    let best = pts[0];
    for (const p of pts) {
        if (p.val > peak.val) peak = p;
        if (p.val < best.val) best = p;
    }
    return {
        hasData: pts.length > 1,
        current,
        avg,
        peak: peak.val,
        peakTime: formatDateToChartAxis(new Date(peak.time)),
        best: best.val,
        bestTime: formatDateToChartAxis(new Date(best.time)),
    };
}

export interface TrendInfo {
    dir: "up" | "down" | "flat";
    pct: number;
    label: string;
    color: string;
    /** Rotation (deg) for the arrow glyph: 0 up, 180 down, 90 flat. */
    rot: number;
}

/**
 * How the line is moving: compares the latest wait to roughly 30 minutes earlier.
 * Mirrors the design's ±6% threshold and labelling.
 */
export function trendInfo(history: RideHistoryEntry[]): TrendInfo | null {
    const pts = numericValues(history);
    if (pts.length < 2) return null;
    const last = pts[pts.length - 1];
    const lastT = new Date(last.time).getTime();
    // Find the entry closest to 30 minutes before the latest snapshot.
    const target = lastT - 30 * 60 * 1000;
    let back = pts[0];
    for (const p of pts) {
        if (new Date(p.time).getTime() <= target) back = p;
        else break;
    }
    if (back.val <= 0) return { dir: "flat", pct: 0, label: "Holding steady", color: "var(--ink-3)", rot: 90 };
    const pct = Math.round(((last.val - back.val) / back.val) * 100);
    if (pct >= 6) return { dir: "up", pct, label: `${pct}% busier`, color: "var(--busy)", rot: 0 };
    if (pct <= -6) return { dir: "down", pct, label: `${Math.abs(pct)}% quieter`, color: "var(--open)", rot: 180 };
    return { dir: "flat", pct, label: "Holding steady", color: "var(--ink-3)", rot: 90 };
}

/**
 * Builds a normalised sparkline path in a 120×34 viewBox from the most recent
 * history points (nulls treated as 0). Returns "" when there isn't enough data.
 */
export function sparkPath(history: RideHistoryEntry[], count = 12): string {
    const recent = (history ?? []).slice(-count);
    if (recent.length < 2) return "";
    const pts = recent.map((h) => (h.waitTime == null ? 0 : h.waitTime));
    const W = 120, H = 34, p = 3, n = pts.length;
    const max = Math.max(10, ...pts);
    const x = (i: number) => p + (i / (n - 1)) * (W - 2 * p);
    const y = (v: number) => H - p - (v / max) * (H - 2 * p);
    let d = `M${x(0).toFixed(1)} ${y(pts[0]).toFixed(1)}`;
    for (let i = 1; i < n; i++) d += ` L${x(i).toFixed(1)} ${y(pts[i]).toFixed(1)}`;
    return d;
}
