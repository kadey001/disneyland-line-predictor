"use client"

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const BTN_STYLE: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "var(--card-2)",
    cursor: "pointer",
    flex: "none",
};

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" style={{ stroke: "var(--gold)", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
    );
}

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" style={{ stroke: "var(--gold)", fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
        </svg>
    );
}

export function ThemeToggle() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Before mount the resolved theme is unknown; show the night (moon) glyph to
    // match the default theme and avoid a hydration mismatch.
    const isNight = !mounted || resolvedTheme !== "light";

    return (
        <button
            type="button"
            onClick={() => setTheme(isNight ? "light" : "dark")}
            aria-label="Toggle day and night"
            className="transition-transform duration-300 hover:rotate-[18deg]"
            style={BTN_STYLE}
        >
            {isNight ? <MoonIcon /> : <SunIcon />}
        </button>
    );
}
