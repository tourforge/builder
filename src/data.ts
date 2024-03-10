export type AssetType = "narration" | "image" | "tiles";

export type ProjectModel = {
  title: string,
  tours: TourModel[],
  assets: {
    [asset: AssetReference]: {
      hash: string,
      alt: string,
      attrib: string,
    },
  },
}

export type TourModel = {
  type: "driving" | "walking",
  id: string,
  title: string,
  desc: string,
  gallery: GalleryModel,
  tiles?: AssetReference,
  route: (StopModel | ControlPointModel)[],
  pois: PoiModel[],
  path: string,
  links?: {
    [name: string]: {
      href: string,
    }
  } | undefined,
}

export type StopModel = {
  type: "stop",
  id: string,
  title: string,
  desc: string,
  lat: number,
  lng: number,
  trigger_radius: number,
  control: "route" | "path" | "none",
  gallery: GalleryModel,
  transcript?: AssetReference,
  narration?: AssetReference,
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

export type GalleryModel = AssetReference[]

export type AssetReference = string

export type LatLng = { lat: number, lng: number }
