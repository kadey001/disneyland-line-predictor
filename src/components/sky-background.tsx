/**
 * Fixed decorative night-sky layer: drifting clouds, twinkling stars, and
 * fireflies. In the day palette --star/--firefly are transparent and --cloud
 * is visible, so the same markup reads correctly in both themes.
 *
 * All positions come from a seeded RNG evaluated at module load, so the server
 * and client render identical markup (no hydration mismatch). Purely decorative
 * and aria-hidden, so this stays a server component (ships no JS).
 */

function rng(seed: number) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let x = Math.imul(t ^ (t >>> 15), 1 | t);
        x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
}

const R = rng(20240707);

const STARS = Array.from({ length: 54 }, () => ({
    left: (R() * 100).toFixed(2) + "%",
    top: (R() * 94).toFixed(2) + "%",
    size: (0.8 + R() * 2.2).toFixed(2) + "px",
    op: (0.3 + R() * 0.7).toFixed(2),
    dur: (3 + R() * 4).toFixed(2) + "s",
    delay: (R() * 5).toFixed(2) + "s",
}));

const FIREFLIES = Array.from({ length: 12 }, () => ({
    left: (R() * 100).toFixed(2) + "%",
    top: (18 + R() * 72).toFixed(2) + "%",
    size: (2 + R() * 3).toFixed(2) + "px",
    dur: (7 + R() * 6).toFixed(2) + "s",
    delay: (R() * 8).toFixed(2) + "s",
}));

const CLOUDS = [
    { left: "-6%", top: "12%", w: "280px", h: "92px", dur: "22s" },
    { left: "60%", top: "7%", w: "330px", h: "112px", dur: "27s" },
    { left: "30%", top: "24%", w: "230px", h: "82px", dur: "19s" },
];

export default function SkyBackground() {
    return (
        <div
            aria-hidden="true"
            style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}
        >
            {CLOUDS.map((c, i) => (
                <div
                    key={`c${i}`}
                    style={{
                        position: "absolute",
                        left: c.left,
                        top: c.top,
                        width: c.w,
                        height: c.h,
                        background: "var(--cloud)",
                        borderRadius: "50%",
                        filter: "blur(26px)",
                        animation: `cloudfloat ${c.dur} ease-in-out infinite`,
                    }}
                />
            ))}
            {STARS.map((s, i) => (
                <span
                    key={`s${i}`}
                    style={{
                        position: "absolute",
                        left: s.left,
                        top: s.top,
                        width: s.size,
                        height: s.size,
                        borderRadius: "50%",
                        background: "var(--star)",
                        boxShadow: "0 0 6px var(--star)",
                        opacity: Number(s.op),
                        animation: `twinkle ${s.dur} ease-in-out infinite`,
                        animationDelay: s.delay,
                    }}
                />
            ))}
            {FIREFLIES.map((f, i) => (
                <span
                    key={`f${i}`}
                    style={{
                        position: "absolute",
                        left: f.left,
                        top: f.top,
                        width: f.size,
                        height: f.size,
                        borderRadius: "50%",
                        background: "var(--firefly)",
                        boxShadow: "0 0 10px 2px var(--firefly)",
                        animation: `drift ${f.dur} ease-in-out infinite`,
                        animationDelay: f.delay,
                    }}
                />
            ))}
        </div>
    );
}
