export type AssetMeta = {
  alt?: string | undefined,
  attrib?: string | undefined,
}

export type TourModel = {
  name: string,
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
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
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
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export type GalleryModel = string[]

export type LatLng = { "lat": number, "lng": number }
