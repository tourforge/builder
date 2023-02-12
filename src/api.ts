import { invoke } from "@tauri-apps/api/tauri";

import * as polyline from "./polyline";
import { ControlPointModel, LatLng, TourModel, WaypointModel } from "./data";

export type AssetKind = "any" | "narration" | "image" | "tiles"

// This is an abstraction over a chosen file in case we want to make a different
// API backend for web browsers
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

export async function listProjects(): Promise<string[]> {
  return await invoke("list_projects");
}

export async function createProject(name: string) {
  await invoke("create_project", { name });
}

export async function openProject(name: string) {
  await invoke("open_project", { name });
}

export async function listTours(): Promise<{ id: string, name: string }[]> {
  return await invoke("list_tours", { projectName: currentProject() });
}

export async function createTour(tour: TourModel): Promise<void> {
  await invoke("create_tour", { projectName: currentProject(), tour });
}

export async function getTour(id: string): Promise<TourModel> {
  return await invoke("get_tour", { projectName: currentProject(), tourId: id });
}

export async function putTour(id: string, tour: TourModel): Promise<void> {
  await invoke("put_tour", { projectName: currentProject(), tourId: id, tour });
}

export async function deleteTour(id: string): Promise<void> {
  await invoke("delete_tour", { projectName: currentProject(), tourId: id });
}

export async function listAssets(query: string = "", kind: AssetKind = "any") {
  let assets: string[] = await invoke("list_assets", { projectName: currentProject() });
  assets = assets.filter(asset => asset.includes(query) && asset.length !== query.length);
  if (kind === "image")
    assets = assets.filter(asset => asset.endsWith(".png") || asset.endsWith(".jpg") || asset.endsWith(".jpeg"));
  if (kind == "narration")
    assets = assets.filter(asset => asset.endsWith(".mp3"));
  if (kind == "tiles")
    assets = assets.filter(asset => asset.endsWith(".mbtiles"));
  return assets;
}

export async function deleteAsset(asset: string): Promise<void> {
  await invoke("delete_asset", { projectName: currentProject(), assetName: asset });
}

export async function getAssetAttrib(asset: string): Promise<string> {
  return await invoke("get_asset_attrib", { projectName: currentProject(), assetName: asset });
}

export async function setAssetAttrib(asset: string, attrib: string): Promise<string> {
  return await invoke("set_asset_attrib", { projectName: currentProject(), assetName: asset, attrib });
}

export async function getAssetAlt(asset: string): Promise<string> {
  return await invoke("get_asset_alt", { projectName: currentProject(), assetName: asset });
}

export async function setAssetAlt(asset: string, alt: string): Promise<string> {
  return await invoke("set_asset_alt", { projectName: currentProject(), assetName: asset, alt });
}

export async function imageAssetUrl(name: string): Promise<string | null> {
  return `otb-asset://${currentProject()}/${name}`;
}

export async function chooseFile(): Promise<ChosenFile | null> {
  const path: string | null = await invoke("choose_file");
  return path !== null ? new ChosenFile(path) : null;
}

export async function importAsset(file: ChosenFile, name: string) {
  await invoke("import_asset", {
    path: file._path,
    projectName: currentProject(),
    name,
  });
}

export async function route(points: (ControlPointModel | WaypointModel)[]): Promise<LatLng[]> {
  const fullPath: LatLng[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const req = JSON.stringify({
      "locations": [a, b].map(ll => ({ "lat": ll.lat, "lon": ll.lng })),
      "costing": "auto",
      "units": "miles"
    });

    if (a.control !== "path" || b.control !== "path") {
      const resp: any = JSON.parse(await invoke("valhalla_route", { req }));
      const path: LatLng[] = resp.trip.legs
        .map((leg: any) => polyline.decode(leg.shape, 6))
        .reduce((a: any, b: any) => [...a, ...b]);
      
      if (a.control === "path") path.unshift(a);
      if (b.control === "path") path.push(b);

      fullPath.push(...path);
    } else {
      fullPath.push(a, b);
    }
  }

  return fullPath;
}

function currentProject(): string | undefined {
  return (window as any).__OPENTOURBUILDER_CURRENT_PROJECT_NAME__;
}
