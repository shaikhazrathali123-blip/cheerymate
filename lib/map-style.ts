import type { Map as MLMap } from "maplibre-gl";

const DEFAULT_LIGHT = "https://tiles.openfreemap.org/styles/positron";
const DEFAULT_DARK = "https://tiles.openfreemap.org/styles/dark";

const withKey = (url: string) => url.replace("{key}", process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "");

export function mapStyleUrl(dark: boolean) {
  const light = process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_LIGHT;
  const darkUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL_DARK || DEFAULT_DARK;
  return withKey(dark ? darkUrl : light);
}

/** Brand the base style: soft cherry-tinted water, muted parks. Fails silently on unknown styles. */
export function brandMapStyle(map: MLMap) {
  const css = getComputedStyle(document.documentElement);
  const water = css.getPropertyValue("--map-water").trim() || "#f6dce0";
  const park = css.getPropertyValue("--map-park").trim() || "#e8f1e4";
  for (const layer of map.getStyle()?.layers ?? []) {
    try {
      if (layer.type === "fill" && /water/i.test(layer.id)) map.setPaintProperty(layer.id, "fill-color", water);
      if (layer.type === "fill" && /park|landuse_park|grass|wood/i.test(layer.id)) map.setPaintProperty(layer.id, "fill-color", park);
    } catch {
      /* ignore */
    }
  }
}
