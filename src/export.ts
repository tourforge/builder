import JSZip from "jszip";

import exportIndexHtmlContent from "./assets/export-index.html?raw";
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

  const assetBlobs: Record<string, Blob> = {};
  if (options.includeAssets) {
    for (const assetInfo of Object.values(projectContent.assets)) {
      const blob = await db.loadAsset(assetInfo.hash);
      if (blob === undefined) {
        console.warn("export warning: ignoring missing blob for asset with hash '" + assetInfo.hash + "'");
      } else {
        assetBlobs[assetInfo.hash] = blob;
      }
    }
  }

  const projectContentString = JSON.stringify(projectContent);

  let zipBlob: Blob;
  try {
    const zip = new JSZip();
    zip.file("index.html", exportIndexHtmlContent.replaceAll("%PROJECT_TITLE%", projectContent.title));
    zip.file("tourforge.json", projectContentString);
    for (const [assetHash, assetBlob] of Object.entries(assetBlobs)) {
      zip.file(assetHash, assetBlob);
    }
    zipBlob = await zip.generateAsync({ type: "blob" });
  } catch (err) {
    throw new ExportError("Failed to create tour zip file.");
  }

  // download the zip file
  const zipUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = zipUrl;
  a.download = "TourForge_" + projectContent.title.replaceAll(" ", "_") + ".zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(zipUrl);
};
