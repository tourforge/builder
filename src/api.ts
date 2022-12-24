import { invoke } from "@tauri-apps/api/tauri";

export type AssetKind = "any" | "narration" | "image"

export async function listAssets(query: string = "", kind: AssetKind = "any") {
  let assets: string[] = await invoke("list_assets");
  assets = assets.filter(asset => asset.includes(query) && asset.length !== query.length);
  if (kind === "image")
    assets = assets.filter(asset => asset.endsWith(".png") || asset.endsWith(".jpg") || asset.endsWith(".jpeg"));
  if (kind == "narration")
    assets = assets.filter(asset => asset.endsWith(".mp3"));
  return assets;
}

export async function chooseAndImportAsset(): Promise<string> {
  return "";
}
