export type TourModel = {
  name: string,
  desc: string,
  waypoints: WaypointModel[],
  gallery: GalleryModel,
  path: string,
  pois: PoiModel[],
}

export type WaypointModel = {
  id: string,
  name: string,
  desc: string,
  lat: number,
  lng: number,
  narration: string | null,
  trigger_radius: number,
  transcript: string | null,
  gallery: GalleryModel,
}

export type PoiModel = {
  name: string,
  desc: string,
  lat: number,
  lng: number,
  gallery: GalleryModel,
}

export type GalleryModel = string[]
