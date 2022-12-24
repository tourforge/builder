import { invoke } from "@tauri-apps/api/tauri";

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
