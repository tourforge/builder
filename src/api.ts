import { invoke } from "@tauri-apps/api/tauri";

import * as polyline from "./polyline";
import { LatLng } from "./data";

export type AssetKind = "any" | "narration" | "image"

export class ChosenFile {
  _path: string;

  constructor(path: string) {
    this._path = path;
  }

  extension() {
    const dotIdx = this._path.lastIndexOf(".");

    if (dotIdx !== -1)
      return this._path.slice(dotIdx);
    else
      return null;
  }
}

export async function listAssets(query: string = "", kind: AssetKind = "any") {
  let assets: string[] = await invoke("list_assets");
  assets = assets.filter(asset => asset.includes(query) && asset.length !== query.length);
  if (kind === "image")
    assets = assets.filter(asset => asset.endsWith(".png") || asset.endsWith(".jpg") || asset.endsWith(".jpeg"));
  if (kind == "narration")
    assets = assets.filter(asset => asset.endsWith(".mp3"));
  return assets;
}

export async function chooseFile(): Promise<ChosenFile | null> {
  const path: string | null = await invoke("choose_file");
  return path !== null ? new ChosenFile(path) : null;
}

export async function importAsset(file: ChosenFile, name: string) {
  await invoke("import_asset", {
    path: file._path,
    name,
  });
}

export async function route(points: LatLng[]): Promise<LatLng[]> {
  const req = JSON.stringify({
    "locations": points.map(ll => ({ "lat": ll.lat, "lon": ll.lng })),
    "costing": "auto",
    "units": "miles"
  });

  const resp: any = JSON.parse(await invoke("valhalla_route", { req }));

  return resp.trip.legs
    .map((leg: any) => polyline.decode(leg.shape, 6))
    .reduce((a: any, b: any) => [...a, ...b]);
}
