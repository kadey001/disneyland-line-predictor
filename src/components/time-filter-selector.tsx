"use client";

// Imports removed

export type TimeFilter = 'full-day' | 'last-8-hours' | 'last-4-hours' | 'last-2-hours' | 'last-hour' | 'last-30-mins'

interface TimeFilterSelectorProps {
    value: TimeFilter;
    onValueChange: (value: TimeFilter) => void;
}

export default function TimeFilterSelector({ value, onValueChange }: TimeFilterSelectorProps) {
    const options: { value: TimeFilter; label: string }[] = [
        { value: 'full-day', label: 'Full Day' },
        { value: 'last-8-hours', label: '8H' },
        { value: 'last-4-hours', label: '4H' },
        { value: 'last-2-hours', label: '2H' },
        { value: 'last-hour', label: '1H' },
        { value: 'last-30-mins', label: '30M' },
    ];

    return (
        <div className="glass flex items-center p-1 rounded-full overflow-x-auto no-scrollbar shadow-sm">
            <div className="flex gap-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => onValueChange(option.value)}
                        className={`relative px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${
                            value === option.value
                                ? 'text-primary-foreground shadow-md'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }`}
                    >
                        {value === option.value && (
                            <span className="absolute inset-0 bg-primary rounded-full -z-10" />
                        )}
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
