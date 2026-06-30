"use client";

export type TimeFilter = 'full-day' | 'last-8-hours' | 'last-4-hours' | 'last-2-hours' | 'last-hour' | 'last-30-mins'

interface TimeFilterSelectorProps {
    value: TimeFilter;
    onValueChange: (value: TimeFilter) => void;
}

const OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: 'last-30-mins', label: '30M' },
    { value: 'last-hour', label: '1H' },
    { value: 'last-2-hours', label: '2H' },
    { value: 'last-4-hours', label: '4H' },
    { value: 'last-8-hours', label: '8H' },
    { value: 'full-day', label: 'Full Day' },
];

const GOLD_GRADIENT = "linear-gradient(180deg,var(--gold-2),var(--gold))";

export default function TimeFilterSelector({ value, onValueChange }: TimeFilterSelectorProps) {
    return (
        <div style={{ display: "flex", gap: 4, background: "var(--card-2)", border: "1px solid var(--line-2)", borderRadius: 13, padding: 4, flexWrap: "wrap" }}>
            {OPTIONS.map((option) => {
                const active = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onValueChange(option.value)}
                        style={{
                            border: "none",
                            cursor: "pointer",
                            fontWeight: 700,
                            fontSize: 13.5,
                            padding: "8px 14px",
                            minHeight: 38,
                            borderRadius: 9,
                            color: active ? "#1a1330" : "var(--ink-2)",
                            background: active ? GOLD_GRADIENT : "transparent",
                        }}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
