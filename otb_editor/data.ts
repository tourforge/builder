export interface AssetMeta {
  alt?: string | undefined,
  attrib?: string | undefined,
}

export interface TourModel {
  desc: string,
  waypoints: (WaypointModel | ControlPointModel)[],
  gallery: GalleryModel,
  path: string,
  pois: PoiModel[],
  tiles: string | undefined,
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export interface WaypointModel {
  type: "waypoint",
  id: string,
  title: string,
  desc: string,
  lat: number,
  lng: number,
  narration: string | null,
  trigger_radius: number,
  transcript: string | null,
  gallery: GalleryModel,
  control: "route" | "path" | "none",
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export interface ControlPointModel {
  type: "control",
  id: string,
  lat: number,
  lng: number,
  control: "route" | "path",
}

export interface PoiModel {
  id: string,
  title: string,
  desc: string,
  lat: number,
  lng: number,
  gallery: GalleryModel,
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export type GalleryModel = string[]

export type LatLng = { lat: number, lng: number }
