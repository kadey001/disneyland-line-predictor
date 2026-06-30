"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWaitTimesData } from "@/hooks/use-wait-times-data";
import { useFilteredRideHistory } from "@/hooks/use-filtered-ride-history";
import { useFavorites } from "@/hooks/use-favorites";
import { calculateWaitTimeTrends } from "@/lib/trend-calculator";
import { buildRideList } from "@/lib/ride-list";
import { rideStats, statusMeta, waitColor } from "@/lib/wait-format";
import type { WaitTimesResponse } from "@/lib/types";
import TimeFilterSelector, { type TimeFilter } from "@/components/time-filter-selector";
import WaitTimeChart from "@/components/wait-time-chart";
import WaitTimeTrendChart from "@/components/wait-time-trend-chart";
import WaitTimeForecastChart from "@/components/wait-time-forecast-chart";
import DisneyLoader from "@/components/disney-loader";

interface RideDetailClientProps {
    rideId: string;
    initialData: WaitTimesResponse | null;
}

const CARD: React.CSSProperties = {
    padding: 20,
    borderRadius: 18,
    background: "var(--card)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow)",
};

const PANEL: React.CSSProperties = {
    padding: "clamp(16px,2vw,24px)",
    borderRadius: 22,
    background: "var(--card)",
    border: "1px solid var(--line)",
    boxShadow: "var(--shadow)",
    backdropFilter: "blur(14px)",
};

const STAT_LABEL: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: ".5px",
    textTransform: "uppercase",
    color: "var(--ink-3)",
    marginBottom: 8,
};

function FavIcon({ filled }: { filled: boolean }) {
    return filled ? (
        <svg viewBox="0 0 24 24" width="17" height="17" style={{ fill: "var(--gold)", stroke: "var(--gold)", strokeWidth: 1.5 }}>
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" width="17" height="17" style={{ fill: "none", stroke: "var(--ink-2)", strokeWidth: 2 }}>
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
    );
}

export default function RideDetailClient({ rideId, initialData }: RideDetailClientProps) {
    const { data, isLoading } = useWaitTimesData({ initialData, selectedRideId: rideId });
    const resolved = data ?? initialData;

    const [range, setRange] = useState<TimeFilter>("last-4-hours");
    const { isFav, toggleFav } = useFavorites();

    const rides = useMemo(() => buildRideList(resolved), [resolved]);
    const ride = useMemo(() => rides.find((r) => r.id === rideId) ?? null, [rides, rideId]);

    const { filteredRidesHistory } = useFilteredRideHistory({
        ridesHistory: resolved?.groupedRidesHistory ?? {},
        timeFilter: range,
        selectedRideId: rideId,
    });

    const trends = useMemo(() => calculateWaitTimeTrends(filteredRidesHistory), [filteredRidesHistory]);
    const stats = useMemo(() => rideStats(filteredRidesHistory), [filteredRidesHistory]);

    const live = resolved?.liveWaitTime?.find((l) => l.rideId === rideId);
    const forecast = live?.forecast;

    if (!ride) {
        if (isLoading || !resolved) return <DisneyLoader />;
        // Resolved data exists but the ride isn't in the atlas.
        return (
            <ClosedShell title="Attraction not found" message="We couldn't find live data for this attraction. It may have been renamed or removed." />
        );
    }

    const status = statusMeta(ride.status, ride.waitTime);
    const hasData = ride.isOpen && stats.hasData;
    const current = ride.waitTime ?? stats.current;
    const trendText =
        current < stats.avg
            ? "Currently below today's average — a great time to hop in line."
            : current > stats.avg
            ? "Running a little above today's average right now."
            : "Right around today's average pace.";

    const saved = isFav(ride.id);

    return (
        <section style={{ width: "min(1180px,100%)", margin: "0 auto", padding: "clamp(20px,3vh,32px) clamp(16px,3vw,30px) clamp(60px,8vh,90px)" }}>
            <Link href="/wait-times" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--ink-2)", fontWeight: 700, fontSize: 14.5, padding: "8px 4px", marginBottom: 14, textDecoration: "none" }}>
                <svg viewBox="0 0 24 24" width="17" height="17" style={{ stroke: "currentColor", fill: "none", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                All attractions
            </Link>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: "clamp(18px,2.4vh,24px)" }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "var(--ink-2)", padding: "5px 11px", borderRadius: 999, background: "var(--card-2)", border: "1px solid var(--line-2)", marginBottom: 11 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: ride.hue }} />
                        {ride.parkLabel}
                    </div>
                    <h2 className="font-serif" style={{ fontWeight: 700, fontSize: "clamp(32px,5.4vw,54px)", lineHeight: 1, margin: 0, letterSpacing: "-0.4px" }}>{ride.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, padding: "5px 12px", borderRadius: 999, color: status.color, background: status.bg }}>
                            <span className="anim-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: status.color }} />
                            {status.label}
                        </span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => toggleFav(ride.id)}
                    aria-pressed={saved}
                    style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "11px 18px", minHeight: 46, borderRadius: 999, cursor: "pointer", fontWeight: 700, fontSize: 14.5, color: "var(--ink)", background: "var(--card)", border: "1px solid var(--line)" }}
                >
                    <FavIcon filled={saved} />
                    {saved ? "Saved" : "Save"}
                </button>
            </div>

            {hasData ? (
                <>
                    <div style={{ display: "grid", gap: "clamp(12px,1.6vw,16px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,180px),1fr))", marginBottom: "clamp(14px,2vh,20px)" }}>
                        <div style={{ ...CARD, background: "linear-gradient(165deg,var(--card-3),var(--card-2))" }}>
                            <div style={STAT_LABEL}>Right now</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                <span style={{ fontWeight: 800, fontSize: 46, lineHeight: 1, color: waitColor(current), fontVariantNumeric: "tabular-nums" }}>{current}</span>
                                <span style={{ fontSize: 15, color: "var(--ink-3)", fontWeight: 600 }}>min</span>
                            </div>
                        </div>
                        <div style={CARD}>
                            <div style={STAT_LABEL}>Today&apos;s average</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                <span style={{ fontWeight: 800, fontSize: 34, lineHeight: 1, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{stats.avg}</span>
                                <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>min</span>
                            </div>
                        </div>
                        <div style={CARD}>
                            <div style={STAT_LABEL}>Peak today</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                <span style={{ fontWeight: 800, fontSize: 34, lineHeight: 1, color: "var(--busy)", fontVariantNumeric: "tabular-nums" }}>{stats.peak}</span>
                                <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>min</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 5 }}>around {stats.peakTime}</div>
                        </div>
                        <div style={CARD}>
                            <div style={STAT_LABEL}>Best window</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                <span style={{ fontWeight: 800, fontSize: 34, lineHeight: 1, color: "var(--open)", fontVariantNumeric: "tabular-nums" }}>{stats.best}</span>
                                <span style={{ fontSize: 14, color: "var(--ink-3)", fontWeight: 600 }}>min</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 5 }}>around {stats.bestTime}</div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: "clamp(14px,2vh,18px)" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-3)", marginRight: 2 }}>Range</span>
                        <TimeFilterSelector value={range} onValueChange={setRange} />
                    </div>

                    <div style={{ ...PANEL, marginBottom: "clamp(12px,1.8vh,18px)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                            <h3 className="font-serif" style={{ fontWeight: 700, fontSize: 24, margin: 0, color: "var(--ink)" }}>Wait time through the day</h3>
                            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-3)", fontWeight: 600 }}>
                                <LegendDot color="var(--open)" label="Light" />
                                <LegendDot color="var(--mod)" label="Moderate" />
                                <LegendDot color="var(--busy)" label="Busy" />
                            </div>
                        </div>
                        <WaitTimeChart history={filteredRidesHistory} />
                    </div>

                    {trends.length >= 2 && (
                        <div style={{ ...PANEL, marginBottom: "clamp(12px,1.8vh,18px)" }}>
                            <h3 className="font-serif" style={{ fontWeight: 700, fontSize: 24, margin: "0 0 3px", color: "var(--ink)" }}>How the line is moving</h3>
                            <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ink-2)" }}>{trendText}</p>
                            <WaitTimeTrendChart trends={trends} />
                        </div>
                    )}

                    {forecast && forecast.length >= 2 && (
                        <div style={PANEL}>
                            <h3 className="font-serif" style={{ fontWeight: 700, fontSize: 24, margin: "0 0 3px", color: "var(--ink)" }}>Predicted wait ahead</h3>
                            <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--ink-2)" }}>Our model&apos;s best guess at how this line will move later today.</p>
                            <WaitTimeForecastChart forecast={forecast} />
                        </div>
                    )}
                </>
            ) : (
                <ClosedShell
                    title={status.label === "Open" ? "Not enough data yet" : "Currently unavailable"}
                    message="Live wait data isn't available for this attraction right now. Check back soon — the magic returns shortly."
                />
            )}
        </section>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
            {label}
        </span>
    );
}

function ClosedShell({ title, message }: { title: string; message: string }) {
    return (
        <div style={{ textAlign: "center", padding: "60px 24px", borderRadius: 22, background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", background: "var(--card-2)", border: "1px solid var(--line-2)", marginBottom: 16 }}>
                <svg viewBox="0 0 24 24" width="28" height="28" style={{ stroke: "var(--ink-3)", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="7" x2="12" y2="13" />
                    <circle cx="12" cy="16.5" r="0.6" style={{ fill: "var(--ink-3)", stroke: "none" }} />
                </svg>
            </div>
            <h3 className="font-serif" style={{ fontSize: 27, margin: "0 0 6px", color: "var(--ink)" }}>{title}</h3>
            <p style={{ margin: "0 auto", fontSize: 15, color: "var(--ink-3)", maxWidth: 380 }}>{message}</p>
        </div>
    );
}
