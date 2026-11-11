import type { MapFeatureProps } from "@/types";

export type NearbyProps = MapFeatureProps & { reasons: string[]; priceLabel: string; occupation: string };
export type NearbyFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: NearbyProps;
};
export type Layer = "people" | "flats" | "both";
