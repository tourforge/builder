import JSZip from "jszip";

import { ProjectModel } from "./data";
import { DB, DbProject } from "./db";

class ExportError extends Error {
  constructor(message: string) {
    super("export error: " + message);
  }
}

export const exportProject = async (db: DB, project: string, options: { includeAssets: boolean } = { includeAssets: true }) => {
  const projectContent: ProjectModel & { id: unknown, source: unknown } | undefined = await db.loadProject(project);
  if (projectContent === undefined) {
    throw new ExportError("failed to load project for export");
  }

  // Manually get rid of the database-specific properties.
  delete projectContent.id;
  delete projectContent.source;

  const assetBlobs: { [assetHash: string]: Blob } = {};
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

  // build the zip file
  const zip = new JSZip();
  // TODO: add an index.html file linking to the tour builder
  zip.file("tourforge.json", projectContentString);
  for (const [assetHash, assetBlob] of Object.entries(assetBlobs)) {
    // TODO: maybe give the asset an extension here based on the blob's media type
    zip.file(assetHash, assetBlob);
  }
  const zipBlob = await zip.generateAsync({ type: "blob" });

  // download the zip file
  const zipUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = zipUrl;
  a.download = projectContent.title + ".tourforge.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(zipUrl);
};