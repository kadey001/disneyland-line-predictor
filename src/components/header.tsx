"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
    { label: "Home", href: "/" },
    { label: "Wait Times", href: "/wait-times" },
];

export default function Header() {
    const pathname = usePathname();

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith("/wait-times");

    return (
        <header
            style={{
                position: "sticky",
                top: 0,
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                padding: "clamp(11px,1.6vw,16px) clamp(14px,3vw,30px)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                background: "var(--header)",
                borderBottom: "1px solid var(--line-2)",
            }}
        >
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
                <svg viewBox="0 0 24 24" width="24" height="24" style={{ filter: "drop-shadow(0 0 7px var(--glow))", flex: "none" }} aria-hidden="true">
                    <path d="M12 2 L13.7 9.1 L21 11 L13.7 12.9 L12 22 L10.3 12.9 L3 11 L10.3 9.1 Z" style={{ fill: "var(--gold)" }} />
                </svg>
                <span className="font-serif" style={{ fontWeight: 700, fontSize: "clamp(21px,2.4vw,27px)", letterSpacing: ".4px", lineHeight: 1 }}>
                    <span style={{ color: "var(--ink)" }}>Line</span> <span style={{ color: "var(--gold)" }}>Magic</span>
                </span>
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px,1vw,10px)" }}>
                <nav
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        background: "var(--card-2)",
                        border: "1px solid var(--line-2)",
                        borderRadius: 999,
                        padding: 4,
                    }}
                >
                    {NAV.map((n) => {
                        const active = isActive(n.href);
                        return (
                            <Link
                                key={n.href}
                                href={n.href}
                                style={{
                                    position: "relative",
                                    color: "var(--ink)",
                                    fontWeight: 700,
                                    fontSize: "clamp(13px,1.3vw,14.5px)",
                                    padding: "9px clamp(12px,1.6vw,18px)",
                                    borderRadius: 999,
                                    minHeight: 40,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    textDecoration: "none",
                                }}
                            >
                                {active && (
                                    <span
                                        style={{
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: 999,
                                            background: "linear-gradient(180deg,var(--glow),rgba(236,199,100,.06))",
                                            border: "1px solid var(--line)",
                                        }}
                                    />
                                )}
                                <span style={{ position: "relative" }}>{n.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <ThemeToggle />
            </div>
        </header>
    );
}
