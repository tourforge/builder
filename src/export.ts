import JSZip from "jszip";

import bundleIndexJsContent from "../gen/bundle/index.js?raw";

import readmeTxtContent from "./bundle/README.txt?raw";
import bundleIndexHtmlContent from "./bundle/index.html?raw";
import { type ProjectModel } from "./data";
import { type DB } from "./db";

export class ExportError extends Error {
}

export const exportProjectBundle = async (db: DB, project: string, options: { includeAssets: boolean } = { includeAssets: true }) => {
  const projectContent: ProjectModel & { id: unknown, source: unknown } | undefined = await db.loadProject(project);
  if (projectContent === undefined) {
    throw new ExportError("Failed to load project for export.");
  }

  // Manually get rid of the database-specific properties.
  delete projectContent.id;
  delete projectContent.source;

  const zipBlob = await exportProjectBundleRaw(projectContent, async (hash) => await db.loadAsset(hash));

  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(currentDate.getDate()).padStart(2, "0");
  const hours = String(currentDate.getHours()).padStart(2, "0");
  const minutes = String(currentDate.getMinutes()).padStart(2, "0");
  const seconds = String(currentDate.getSeconds()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;

  // download the zip file
  const zipUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = zipUrl;
  a.download = "TourForge-" + projectContent.title.replaceAll(" ", "-") + "-" + dateString + ".zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(zipUrl);
};

const exportProjectBundleRaw = async (project: ProjectModel, loadAsset: (hash: string) => Promise<Blob | undefined>, options: { includeAssets: boolean } = { includeAssets: true }) => {
  const assetBlobs: Record<string, Blob> = {};
  if (options.includeAssets) {
    for (const assetInfo of Object.values(project.assets)) {
      const blob = await loadAsset(assetInfo.hash);
      if (blob === undefined) {
        console.warn("export warning: ignoring missing blob for asset with hash '" + assetInfo.hash + "'");
      } else {
        assetBlobs[assetInfo.hash] = blob;
      }
    }
  }

  const projectContentString = JSON.stringify(project);

  let zipBlob: Blob;
  try {
    const zip = new JSZip();
    zip.file("README.txt", readmeTxtContent);
    zip.file("index.html", bundleIndexHtmlContent.replaceAll("%PROJECT_TITLE%", project.title).replaceAll("%INDEX_JS%", "index.js"));
    zip.file("index.js", bundleIndexJsContent);
    zip.file("tourforge.json", projectContentString);
    for (const [assetHash, assetBlob] of Object.entries(assetBlobs)) {
      zip.file(assetHash, assetBlob);
    }
    zipBlob = await zip.generateAsync({ type: "blob" });
  } catch (err) {
    throw new ExportError("Failed to create tour zip file.");
  }

  return zipBlob;
};
