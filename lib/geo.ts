/**
 * Location privacy helpers.
 * - snap to a ~500 m grid cell
 * - add a fixed per-user offset (generated once, stored hidden)
 * - only the resulting fuzzed point is ever saved; precise input is discarded
 */

const GRID_METERS = 500;
const METERS_PER_DEG_LAT = 111_320;

export type Jitter = { dLat: number; dLng: number };

/** Random offset up to ~200 m in any direction; generated ONCE per user. */
export function newJitter(): Jitter {
  const angle = Math.random() * Math.PI * 2;
  const dist = 60 + Math.random() * 140; // metres
  return {
    dLat: (Math.sin(angle) * dist) / METERS_PER_DEG_LAT,
    dLng: Math.cos(angle) * dist, // metres; converted per-latitude in fuzz()
  };
}

export function fuzzLocation(lat: number, lng: number, jitter: Jitter): { lat: number; lng: number } {
  const latStep = GRID_METERS / METERS_PER_DEG_LAT;
  const snappedLat = Math.floor(lat / latStep) * latStep + latStep / 2;
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((snappedLat * Math.PI) / 180);
  const lngStep = GRID_METERS / metersPerDegLng;
  const snappedLng = Math.floor(lng / lngStep) * lngStep + lngStep / 2;
  return {
    lat: round6(snappedLat + jitter.dLat),
    lng: round6(snappedLng + jitter.dLng / metersPerDegLng),
  };
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** Haversine distance in km. */
export function distanceKm(a: [number, number], b: [number, number]) {
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Never exact metres: "< 1 km", "~2 km", "~5 km", "~10 km", "10+ km". */
export function roundedDistanceLabel(km: number) {
  if (km < 1) return "< 1 km";
  if (km < 2.5) return "~2 km";
  if (km < 4) return "~3 km";
  if (km < 7.5) return "~5 km";
  if (km < 12.5) return "~10 km";
  return "10+ km";
}

export const LOCATION_COOLDOWN_MS = 6 * 60 * 60 * 1000;
