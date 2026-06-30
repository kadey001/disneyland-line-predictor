"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useWaitTimesData } from "@/hooks/use-wait-times-data";
import { buildRideList, shortestPicks, summarize } from "@/lib/ride-list";
import type { WaitTimesResponse } from "@/lib/types";

interface HomeClientProps {
    initialData: WaitTimesResponse | null;
}

const FEATURES = [
    {
        title: "Live Wait Times",
        text: "Real-time queues for every attraction, refreshed throughout the day.",
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" style={{ stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 16 14" />
            </svg>
        ),
    },
    {
        title: "Hourly Trends",
        text: "See how each line rises and falls, so you can find the perfect window.",
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22" style={{ stroke: "currentColor", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                <polyline points="3 17 9 11 13 15 21 6" />
                <polyline points="15 6 21 6 21 12" />
            </svg>
        ),
    },
    {
        title: "Smart Picks",
        text: "We surface the shortest waits right now, so you never have to guess.",
        icon: (
            <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M12 2 L13.6 9.2 L21 11 L13.6 12.8 L12 22 L10.4 12.8 L3 11 L10.4 9.2 Z" style={{ fill: "currentColor" }} />
            </svg>
        ),
    },
];

export default function HomeClient({ initialData }: HomeClientProps) {
    const { data } = useWaitTimesData({ initialData });
    const resolved = data ?? initialData;

    const rides = useMemo(() => buildRideList(resolved), [resolved]);
    const picks = useMemo(() => shortestPicks(rides, 3), [rides]);
    const summary = useMemo(() => summarize(rides), [rides]);

    const peekHref = summary.busiestId ? `/wait-times/${summary.busiestId}` : "/wait-times";

    return (
        <section style={{ position: "relative" }}>
            <div style={{ width: "min(1180px,100%)", margin: "0 auto", padding: "clamp(38px,7vh,82px) clamp(16px,3vw,30px) clamp(28px,4vh,44px)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

                <h1 className="font-serif" style={{ fontWeight: 700, fontSize: "clamp(43px,8vw,88px)", lineHeight: 1.04, letterSpacing: "-0.5px", margin: 0, textWrap: "balance" }}>
                    <span style={{ color: "var(--ink)" }}>Less waiting,</span>
                    <br />
                    <span style={{ background: "linear-gradient(100deg,var(--gold-2),var(--gold) 55%,var(--gold-deep))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 2px 18px var(--glow))" }}>more wonder.</span>
                </h1>

                <p style={{ maxWidth: 600, margin: "clamp(22px,3.4vh,32px) auto 0", fontSize: "clamp(15.5px,1.7vw,18.5px)", lineHeight: 1.6, color: "var(--ink-2)", textWrap: "pretty" }}>
                    Live wait times, hour-by-hour trends, and the shortest lines right now — for every ride in the park. Spend your day on the attractions, not in the queue.
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 13, justifyContent: "center", marginTop: "clamp(26px,3.4vh,36px)" }}>
                    <Link href="/wait-times" className="transition-transform duration-200 hover:-translate-y-0.5" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "15px 26px", minHeight: 52, borderRadius: 999, textDecoration: "none", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", color: "#1a1330", background: "linear-gradient(180deg,var(--gold-2),var(--gold))", boxShadow: "0 16px 40px -14px var(--glow),inset 0 1px 0 rgba(255,255,255,.5)" }}>
                        Explore wait times
                        <svg viewBox="0 0 24 24" width="19" height="19" style={{ stroke: "#1a1330", fill: "none", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" }}>
                            <line x1="5" y1="12" x2="18" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                    <Link href={peekHref} className="transition-transform duration-200 hover:-translate-y-0.5" style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "15px 24px", minHeight: 52, borderRadius: 999, textDecoration: "none", fontWeight: 700, fontSize: 15.5, whiteSpace: "nowrap", color: "var(--ink)", background: "var(--card)", border: "1px solid var(--line)", backdropFilter: "blur(8px)" }}>
                        Peek at a ride
                    </Link>
                </div>

                {picks.length > 0 && (
                    <div style={{ width: "min(560px,100%)", marginTop: "clamp(34px,5vh,52px)", textAlign: "left", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 22, boxShadow: "var(--shadow)", backdropFilter: "blur(18px)", padding: "clamp(18px,2.4vw,24px)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 800, fontSize: 13, letterSpacing: ".6px", textTransform: "uppercase", color: "var(--ink-2)" }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" style={{ filter: "drop-shadow(0 0 4px var(--glow))" }}>
                                    <path d="M12 3 L13.2 9 L19 10.5 L13.2 12 L12 19 L10.8 12 L5 10.5 L10.8 9 Z" style={{ fill: "var(--gold)" }} />
                                </svg>
                                Shortest waits right now
                            </div>
                            <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontWeight: 600 }}>tap to view</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {picks.map((p, i) => (
                                <Link
                                    key={p.id}
                                    href={`/wait-times/${p.id}`}
                                    className="transition-transform duration-200 hover:translate-x-[3px]"
                                    style={{ display: "flex", alignItems: "center", gap: 13, padding: "11px 12px", borderRadius: 14, textDecoration: "none", background: "var(--card-2)", border: "1px solid transparent" }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%", background: "var(--glow)", color: "var(--gold-2)", fontWeight: 800, fontSize: 13, flex: "none" }}>{i + 1}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-3)" }}>
                                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.hue, flex: "none" }} />
                                            {p.parkLabel}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right", flex: "none" }}>
                                        <span style={{ fontWeight: 800, fontSize: 21, color: "var(--open)" }}>{p.waitTime}</span>
                                        <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 3 }}>min</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ width: "min(1180px,100%)", margin: "0 auto", padding: "0 clamp(16px,3vw,30px) clamp(20px,3vh,34px)" }}>
                <div style={{ display: "grid", gap: "clamp(12px,1.6vw,18px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,240px),1fr))" }}>
                    {FEATURES.map((f) => (
                        <div key={f.title} style={{ display: "flex", flexDirection: "column", gap: 11, padding: "clamp(18px,2vw,24px)", borderRadius: 20, background: "var(--card)", border: "1px solid var(--line)", boxShadow: "var(--shadow)", backdropFilter: "blur(14px)" }}>
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 14, background: "var(--glow)", border: "1px solid var(--line)", color: "var(--gold-2)" }}>
                                {f.icon}
                            </span>
                            <h3 className="font-serif" style={{ fontWeight: 700, fontSize: 23, margin: "2px 0 0", color: "var(--ink)" }}>{f.title}</h3>
                            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--ink-3)" }}>{f.text}</p>
                        </div>
                    ))}
                </div>

                {summary.openCount > 0 && (
                    <div style={{ marginTop: "clamp(16px,2vh,22px)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "clamp(12px,3vw,30px)", padding: "16px 22px", borderRadius: 18, background: "var(--card-2)", border: "1px solid var(--line-2)", fontSize: 13.5, color: "var(--ink-2)" }}>
                        <span style={{ color: "var(--ink-3)" }}>·</span>
                        <span><b style={{ color: "var(--ink)" }}>{summary.openCount}</b> attractions open</span>
                        <span style={{ color: "var(--ink-3)" }}>·</span>
                        <span>Avg wait: <b style={{ color: "var(--ink)" }}>{summary.avgWait} min</b></span>
                        <span style={{ color: "var(--ink-3)" }}>·</span>
                        <span>Busiest Ride: <b style={{ color: "var(--ink)" }}>{summary.busiest}</b></span>
                    </div>
                )}
            </div>
        </section>
    );
}
