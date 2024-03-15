import JSZip from "jszip";
import { v4 as uuidv4 } from "uuid";

import type { DbProject, DB } from "./db";
import { type ProjectModel, ProjectModelSchema } from "./data";

export class ImportError extends Error {
}

export type ReplacementAction = "cancel" | "new" | { replace: string };

/**
 * Imports a project bundle from a zip file.
 */
export const importBundle = async (db: DB, file: File, chooseReplacement?: (options: DbProject[]) => Promise<ReplacementAction>) => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (e) {
    throw new ImportError("The chosen file does not appear to be a valid zip file.", { cause: e });
  }
  const projectJsonFile = zip.file("tourforge.json");
  if (projectJsonFile == null) {
    throw new ImportError("Malformed project bundle: tourforge.json is missing.");
  }
  let projectJsonText: string;
  try {
    projectJsonText = await projectJsonFile.async("text");
  } catch (e) {
    throw new ImportError("Malformed project bundle: tourforge.json could not be loaded as text.", { cause: e });
  }
  let projectJson: unknown;
  try {
    projectJson = JSON.parse(projectJsonText);
  } catch (e) {
    throw new ImportError("Malformed project bundle: tourforge.json could not pe parsed as JSON.", { cause: e });
  }
  let project: ProjectModel;
  try {
    project = ProjectModelSchema.parse(projectJson);
  } catch (e) {
    throw new ImportError("Malformed project bundle: tourforge.json has an invalid schema.", { cause: e });
  }
  const assetBlobs: Record<string, Blob> = {};
  for (const assetInfo of Object.values(project.assets)) {
    const path = assetInfo.hash;
    const assetFile = zip.file(path);
    if (assetFile == null) {
      console.warn("Ignoring missing asset with hash", path);
      continue;
    }
    let assetBlob: Blob;
    try {
      assetBlob = await assetFile.async("blob");
    } catch (e) {
      console.warn("Ignoring failed read of asset with hash", path);
      continue;
    }
    assetBlobs[path] = assetBlob;
  }

  // Figure out if there's another project with the same originalId already.
  const existingWithOriginalId: DbProject[] = [];
  for (const otherProject of await db.listProjects()) {
    if (otherProject.originalId === project.originalId) {
      existingWithOriginalId.push(otherProject);
    }
  }

  let replacementAction: ReplacementAction = "new";
  if (chooseReplacement != null && existingWithOriginalId.length > 0) {
    replacementAction = await chooseReplacement(existingWithOriginalId);
  }

  let projectId: string;
  if (replacementAction === "cancel") {
    return;
  } else if (replacementAction === "new") {
    projectId = uuidv4();
  } else {
    projectId = replacementAction.replace;
  }

  const dbProject = {
    ...project,
    id: projectId,
    source: { type: "bundle" } as const,
  };

  await db.storeProject(dbProject);
  for (const [hash, blob] of Object.entries(assetBlobs)) {
    if (!await db.containsAsset(hash)) {
      // We're assuming that the hash used in the project for the asset is correct.
      // There's no reason why it shouldn't be unless the bundle we're importing is
      // malicious, but very little could be gained from making a malicious bundle.
      // This is especially true because we only store the blob if the hash is
      // unused in the database.
      await db.storeAssetWithHash(hash, blob);
    }
  }

  return dbProject;
};
