"use client";

import Link from "next/link";
import type { RideVM } from "@/lib/ride-list";
import { statusMeta, waitColor, waitLabel, sparkPath, trendInfo } from "@/lib/wait-format";

interface RideCardProps {
    ride: RideVM;
    isFav: boolean;
    onToggleFav: (id: string) => void;
}

export default function RideCard({ ride, isFav, onToggleFav }: RideCardProps) {
    const status = statusMeta(ride.status, ride.waitTime);
    const showWait = status.isOpen && ride.waitTime !== null;
    const color = waitColor(showWait ? ride.waitTime : null);
    const spark = showWait ? sparkPath(ride.history) : "";
    const trend = showWait ? trendInfo(ride.history) : null;

    const handleFav = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFav(ride.id);
    };

    return (
        <Link
            href={`/wait-times/${ride.id}`}
            className="anim-rise transition-transform duration-300 hover:-translate-y-1"
            style={{ position: "relative", display: "flex", flexDirection: "column", gap: 15, padding: 18, borderRadius: 20, textDecoration: "none", background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow)", backdropFilter: "blur(15px)", overflow: "hidden" }}
        >
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: ride.hue }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, fontWeight: 700, color: "var(--ink-2)", padding: "5px 10px", borderRadius: 999, background: "var(--card-2)", border: "1px solid var(--line-2)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: ride.hue, flex: "none" }} />
                    {ride.parkLabel}
                </div>
                <button
                    type="button"
                    onClick={handleFav}
                    aria-label={isFav ? "Remove favorite" : "Save favorite"}
                    aria-pressed={isFav}
                    className="transition-transform duration-200 hover:scale-110"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1px solid var(--line-2)", background: "var(--card-2)", cursor: "pointer", flex: "none" }}
                >
                    {isFav ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" style={{ fill: "var(--gold)", stroke: "var(--gold)", strokeWidth: 1.5 }}>
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="16" height="16" style={{ fill: "none", stroke: "var(--ink-3)", strokeWidth: 2 }}>
                            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8Z" />
                        </svg>
                    )}
                </button>
            </div>

            <div>
                <h3 className="font-serif" style={{ fontWeight: 700, fontSize: 23, lineHeight: 1.08, margin: 0, color: "var(--ink)" }}>{ride.name}</h3>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 38, lineHeight: 1, color, fontVariantNumeric: "tabular-nums" }}>
                        {waitLabel(ride.status, ride.waitTime)}
                    </span>
                    {showWait && <span style={{ fontSize: 13, color: "var(--ink-3)", fontWeight: 600 }}>min</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 7 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 999, color: status.color, background: status.bg }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: status.color }} />
                        {status.label}
                    </span>
                    {spark && (
                        <svg viewBox="0 0 120 34" width="96" height="28" preserveAspectRatio="none" style={{ display: "block" }}>
                            <path d={spark} style={{ fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round", opacity: 0.9 }} />
                        </svg>
                    )}
                </div>
            </div>

            {trend && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: trend.color, borderTop: "1px solid var(--line-2)", paddingTop: 11 }}>
                    <svg viewBox="0 0 24 24" width="13" height="13" style={{ transform: `rotate(${trend.rot}deg)`, flex: "none" }}>
                        <path d="M12 4 L19 14 L13.5 14 L13.5 20 L10.5 20 L10.5 14 L5 14 Z" style={{ fill: trend.color }} />
                    </svg>
                    {trend.label}
                </div>
            )}
        </Link>
    );
}
