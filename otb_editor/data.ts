export interface TourModel {
  version: "1",
  type: "driving" | "walking",
  desc: string,
  gallery: GalleryModel,
  tiles: string | undefined,
  route: (StopModel | ControlPointModel)[],
  pois: PoiModel[],
  path: string,
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export interface StopModel {
  type: "stop",
  control: "route" | "path" | "none",
  id: string,
  lat: number,
  lng: number,
  trigger_radius: number,
  title: string,
  desc: string,
  transcript: string | null,
  gallery: GalleryModel,
  narration: string | null,
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export interface ControlPointModel {
  type: "control",
  control: "route" | "path",
  id: string,
  lat: number,
  lng: number,
}

export interface PoiModel {
  id: string,
  lat: number,
  lng: number,
  title: string,
  desc: string,
  gallery: GalleryModel,
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export type GalleryModel = string[]

export type LatLng = { lat: number, lng: number }
