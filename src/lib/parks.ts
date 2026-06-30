/**
 * Park metadata for the "Line Magic" UI. The design grouped rides by fictional
 * "lands" with distinct hues; our real data only has two parks, so the land
 * filter chips and per-card color accents map to these.
 */

export interface ParkMeta {
    /** Exact parkName as it appears in the attractionAtlas. */
    name: string;
    /** Short label for filter chips. */
    label: string;
    /** Accent hue used for the card stripe / filter dot. */
    hue: string;
}

export const PARKS: ParkMeta[] = [
    { name: "Disneyland Park", label: "Disneyland", hue: "#c79cff" },
    { name: "Disney California Adventure Park", label: "California Adventure", hue: "#6cc6ee" },
];

const PARK_BY_NAME = new Map(PARKS.map((p) => [p.name, p]));

/** Fallback hue for rides whose park isn't recognised. */
export const DEFAULT_PARK_HUE = "var(--gold)";

export function getParkMeta(parkName: string | undefined | null): ParkMeta | undefined {
    if (!parkName) return undefined;
    return PARK_BY_NAME.get(parkName);
}

export function getParkHue(parkName: string | undefined | null): string {
    return getParkMeta(parkName)?.hue ?? DEFAULT_PARK_HUE;
}

export function getParkLabel(parkName: string | undefined | null): string {
    return getParkMeta(parkName)?.label ?? (parkName ?? "Park");
}
