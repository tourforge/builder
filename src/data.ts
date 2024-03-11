export type AssetType = "narration" | "image" | "tiles";

export interface ProjectModel {
  title: string,
  tours: TourModel[],
  assets: Record<AssetReference, {
    hash: string,
    alt: string,
    attrib: string,
  }>,
}

export interface TourModel {
  type: "driving" | "walking",
  id: string,
  title: string,
  desc: string,
  gallery: GalleryModel,
  tiles?: AssetReference,
  route: Array<StopModel | ControlPointModel>,
  pois: PoiModel[],
  path: string,
  links?: Record<string, {
    href: string,
  }> | undefined,
}

export interface StopModel {
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
  links?: Record<string, {
    href: string,
  }> | undefined,
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
  lat: number,
  lng: number,
  title: string,
  desc: string,
  gallery: GalleryModel,
  links?: Record<string, {
    href: string,
  }> | undefined,
}

export type GalleryModel = AssetReference[];

export type AssetReference = string;

export interface LatLng { lat: number, lng: number }
