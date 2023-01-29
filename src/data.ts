export type TourModel = {
  name: string,
  desc: string,
  waypoints: (WaypointModel | ControlPointModel)[],
  gallery: GalleryModel,
  path: string,
  pois: PoiModel[],
  tiles: string | undefined,
}

export type WaypointModel = {
  type: "waypoint",
  id: string,
  name: string,
  desc: string,
  lat: number,
  lng: number,
  narration: string | null,
  trigger_radius: number,
  transcript: string | null,
  gallery: GalleryModel,
  control: "route" | "path",
}

export type ControlPointModel = {
  type: "control",
  id: string,
  lat: number,
  lng: number,
  control: "route" | "path",
}

export type PoiModel = {
  id: string,
  name: string,
  desc: string,
  lat: number,
  lng: number,
  gallery: GalleryModel,
}

export type GalleryModel = string[]

export type LatLng = { "lat": number, "lng": number }
