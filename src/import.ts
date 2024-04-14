import { v4 as uuidv4 } from "uuid";
import JSZip from "jszip";
import { z } from "zod";

import { type ProjectModel, ProjectModelSchema } from "./data";
import { type DB, type DbProject } from "./db";

export class ImportError extends Error {
}

export type ReplacementAction = "cancel" | "new" | { replace: string };

export const importProjectBundle = async (db: DB, file: File, chooseReplacement?: (options: DbProject[]) => Promise<ReplacementAction>) => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(file);
  } catch (e) {
    throw new ImportError("The chosen file does not appear to be a valid zip file.", { cause: e });
  }
  const projectJsonFile = zip.file("tourforge.json");
  if (projectJsonFile == null) {
    throw new ImportError("tourforge.json is missing.");
  }
  let projectJsonText: string;
  try {
    projectJsonText = await projectJsonFile.async("text");
  } catch (e) {
    throw new ImportError("Failed to load tourforge.json as text.");
  }

  return await importProject(
    db,
    async () => JSON.parse(projectJsonText),
    async (hash) => {
      const assetFile = zip.file(hash);
      if (assetFile == null) {
        throw new ImportError("The asset with hash " + hash + " is missing.");
      }
      return await assetFile.async("blob");
    },
    chooseReplacement,
  );
};

const responseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), asset: z.string(), data: z.instanceof(Blob) }),
  z.object({ status: z.literal("failure"), asset: z.optional(z.string()) }),
]);

export const importProjectUrl = async (db: DB, url: URL, chooseReplacement?: (options: DbProject[]) => Promise<ReplacementAction>) => {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new ImportError("Project URLs must use http or https protocols.");
  }

  // Add an invisible iframe with the given URL.
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = url.toString();

  document.body.appendChild(iframe);

  // Wait for the iframe to load
  await new Promise<void>(resolve => {
    iframe.addEventListener("load", () => { resolve(); });
  });

  const result = await importProject(
    db,
    async () => JSON.parse(await (await loadViaIFrame(url.origin, iframe, "tourforge.json")).text()),
    async (hash) => await loadViaIFrame(url.origin, iframe, hash),
    chooseReplacement,
  );

  document.body.removeChild(iframe);

  return result;

  // The commented code gets the tour data via the fetch API. Only works if the external server has
  // added CORS headers allowing the tour builder to make the requests. I.e., usually fails.
  // TODO: Use this method as a fallback when something doesn't work with the iframe method?
  /* if (url.pathname.endsWith("/index.html")) {
    url.pathname = url.pathname.slice(0, url.pathname.length - "/index.html".length);
  } else if (url.pathname.endsWith("/index.html/")) {
    url.pathname = url.pathname.slice(0, url.pathname.length - "/index.html".length);
  } else if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, url.pathname.length - "/".length);
  }

  return await importProject(
    db,
    async () => {
      const resp = await fetch(`${url.toString()}/tourforge.json`);
      if (!resp.ok) {
        throw new ImportError("Failed to download tourforge.json.");
      }
      const respJson = await resp.json();
      return respJson;
    },
    async (hash) => {
      const resp = await fetch(`${url.toString()}/${hash}`);
      if (!resp.ok) {
        throw new ImportError("Failed to download asset with hash " + hash);
      }
      const respBlob = await resp.blob();
      return respBlob;
    },
  ); */
};

const loadViaIFrame = async (origin: string, iframe: HTMLIFrameElement, asset: string, timeout: number = 10000) => {
  return await new Promise<Blob>((resolve, reject) => {
    const eventListener = (ev: MessageEvent) => {
      console.log(ev);
      if (ev.source !== iframe.contentWindow) {
        // Ignore this message, it could be for something else
        return;
      }

      const parseResult = responseSchema.safeParse(ev.data);
      if (!parseResult.success) {
        // Ignore this failure, it could be for another request
        return;
      }
      const response = parseResult.data;

      if (response.asset === asset) {
        if (response.status === "success") {
          window.removeEventListener("message", eventListener);
          resolve(response.data);
        } else {
          window.removeEventListener("message", eventListener);
          reject(new ImportError("Failed to request asset via iframe"));
        }
      }
    };

    // Automatically timeout
    setTimeout(() => {
      window.removeEventListener("message", eventListener);
      reject(new ImportError("Timed out while requesting asset via iframe"));
    }, timeout);

    // Add the listener
    window.addEventListener("message", eventListener);

    // And finally, send the message
    iframe.contentWindow!.postMessage(asset, origin);
  });
};

const importProject = async (
  db: DB,
  loadProjectJson: () => Promise<unknown>,
  loadAssetBlob: (hash: string) => Promise<Blob>,
  chooseReplacement?: (options: DbProject[]) => Promise<ReplacementAction>,
) => {
  let projectJson: unknown;
  try {
    projectJson = await loadProjectJson();
  } catch (e) {
    throw new ImportError("tourforge.json could not be loaded as JSON.", { cause: e });
  }
  let project: ProjectModel;
  try {
    project = ProjectModelSchema.parse(projectJson);
  } catch (e) {
    throw new ImportError("tourforge.json has an invalid schema.", { cause: e });
  }
  const assetBlobs: Record<string, Blob> = {};
  for (const assetInfo of Object.values(project.assets)) {
    let assetBlob: Blob | undefined;
    try {
      assetBlob = await loadAssetBlob(assetInfo.hash);
    } catch (e) {
      console.warn("Ignoring failed read of asset with hash", assetInfo.hash, e);
      continue;
    }
    assetBlobs[assetInfo.hash] = assetBlob;
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
