export default function Footer() {
    return (
        <footer
            style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                padding: "26px 20px 34px",
                borderTop: "1px solid var(--line-2)",
                color: "var(--ink-3)",
                fontSize: "12.5px",
            }}
        >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                    <path d="M12 4 L13 9 L18 10 L13 11 L12 16 L11 11 L6 10 L11 9 Z" style={{ fill: "var(--gold)" }} />
                </svg>
                Line Magic · Live theme-park ride wait times — a fictional park experience. Not affiliated with any real theme park.
            </div>
        </footer>
    );
}
