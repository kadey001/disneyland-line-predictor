"use client";

import { useMemo, useState } from "react";
import type { RideVM } from "@/lib/ride-list";
import { PARKS } from "@/lib/parks";
import { useFavorites } from "@/hooks/use-favorites";
import RideCard from "@/components/ride-card";

type SortKey = "short" | "long" | "park" | "az";

const SORTS: { key: SortKey; label: string }[] = [
    { key: "short", label: "Shortest" },
    { key: "long", label: "Longest" },
    { key: "park", label: "By park" },
    { key: "az", label: "A–Z" },
];

const GOLD_GRADIENT = "linear-gradient(180deg,var(--gold-2),var(--gold))";

// Open rides sort ahead of closed ones regardless of the chosen order.
const rank = (r: RideVM) => (r.isOpen ? 0 : 1);

interface WaitTimesGridProps {
    rides: RideVM[];
}

export default function WaitTimesGrid({ rides }: WaitTimesGridProps) {
    const { isFav, toggleFav } = useFavorites();
    const [q, setQ] = useState("");
    const [sort, setSort] = useState<SortKey>("short");
    const [park, setPark] = useState<string>("all");

    const parkCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const r of rides) counts[r.parkName] = (counts[r.parkName] ?? 0) + 1;
        return counts;
    }, [rides]);

    const filtered = useMemo(() => {
        let list = rides.slice();
        if (park !== "all") list = list.filter((r) => r.parkName === park);
        const query = q.trim().toLowerCase();
        if (query) list = list.filter((r) => r.name.toLowerCase().includes(query) || r.parkLabel.toLowerCase().includes(query));

        const waitAsc = (r: RideVM) => (r.waitTime == null ? Number.POSITIVE_INFINITY : r.waitTime);
        const waitDesc = (r: RideVM) => (r.waitTime == null ? -1 : r.waitTime);
        if (sort === "short") list.sort((a, b) => rank(a) - rank(b) || waitAsc(a) - waitAsc(b));
        else if (sort === "long") list.sort((a, b) => rank(a) - rank(b) || waitDesc(b) - waitDesc(a));
        else if (sort === "park") list.sort((a, b) => a.parkLabel.localeCompare(b.parkLabel) || a.name.localeCompare(b.name));
        else list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [rides, park, q, sort]);

    const segStyle = (active: boolean): React.CSSProperties => ({
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 13.5,
        padding: "9px 13px",
        minHeight: 40,
        borderRadius: 10,
        color: active ? "#1a1330" : "var(--ink-2)",
        background: active ? GOLD_GRADIENT : "transparent",
    });

    return (
        <section style={{ width: "min(1180px,100%)", margin: "0 auto", padding: "clamp(22px,3.4vh,38px) clamp(16px,3vw,30px) clamp(60px,8vh,90px)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginBottom: "clamp(18px,2.4vh,24px)" }}>
                <div>
                    <h2 className="font-serif" style={{ fontWeight: 700, fontSize: "clamp(30px,4.6vw,46px)", lineHeight: 1.02, margin: 0, letterSpacing: "-0.3px" }}>Tonight at the Park</h2>
                    <p style={{ margin: "7px 0 0", color: "var(--ink-2)", fontSize: 15 }}>{filtered.length} attractions · tap any ride for full trends</p>
                </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <div style={{ position: "relative", flex: 1, minWidth: 210 }}>
                    <span style={{ position: "absolute", left: 15, top: "50%", transform: "translateY(-50%)", display: "flex", color: "var(--ink-3)" }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" style={{ stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round" }}>
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.5" y2="16.5" />
                        </svg>
                    </span>
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search attractions or parks…"
                        aria-label="Search attractions or parks"
                        style={{ width: "100%", height: 48, padding: "0 16px 0 44px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)", fontSize: 15, outline: "none", backdropFilter: "blur(10px)" }}
                    />
                </div>
                <div style={{ display: "flex", gap: 4, background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 4, flexWrap: "wrap" }}>
                    {SORTS.map((s) => (
                        <button key={s.key} type="button" onClick={() => setSort(s.key)} style={segStyle(sort === s.key)}>{s.label}</button>
                    ))}
                </div>
            </div>

            <div data-hbar="1" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: "clamp(16px,2.2vh,22px)", WebkitOverflowScrolling: "touch" }}>
                <button
                    type="button"
                    onClick={() => setPark("all")}
                    style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", cursor: "pointer", fontWeight: 700, fontSize: 13.5, padding: "9px 15px", minHeight: 40, borderRadius: 999, color: park === "all" ? "#1a1330" : "var(--ink-2)", background: park === "all" ? GOLD_GRADIENT : "var(--card-2)", border: `1px solid ${park === "all" ? "transparent" : "var(--line-2)"}` }}
                >
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--gold)", flex: "none" }} />
                    All Parks
                    <span style={{ fontSize: 12, opacity: 0.7 }}>{rides.length}</span>
                </button>
                {PARKS.map((p) => {
                    const active = park === p.name;
                    return (
                        <button
                            key={p.name}
                            type="button"
                            onClick={() => setPark(p.name)}
                            style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", cursor: "pointer", fontWeight: 700, fontSize: 13.5, padding: "9px 15px", minHeight: 40, borderRadius: 999, color: active ? "var(--ink)" : "var(--ink-2)", background: active ? "var(--card-3)" : "var(--card-2)", border: `1px solid ${active ? p.hue : "var(--line-2)"}` }}
                        >
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: p.hue, flex: "none" }} />
                            {p.label}
                            <span style={{ fontSize: 12, opacity: 0.7 }}>{parkCounts[p.name] ?? 0}</span>
                        </button>
                    );
                })}
            </div>

            {filtered.length > 0 ? (
                <div style={{ display: "grid", gap: "clamp(12px,1.6vw,17px)", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,272px),1fr))" }}>
                    {filtered.map((ride) => (
                        <RideCard key={ride.id} ride={ride} isFav={isFav(ride.id)} onToggleFav={toggleFav} />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-3)" }}>
                    <div className="font-serif" style={{ fontSize: 26, color: "var(--ink-2)", marginBottom: 6 }}>No attractions found</div>
                    <p style={{ margin: 0, fontSize: 15 }}>Try a different search or park.</p>
                </div>
            )}
        </section>
    );
}
