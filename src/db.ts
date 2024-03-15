import { openDB, type DBSchema } from "idb";
import { createSHA256 } from "hash-wasm";
import { type IHasher } from "hash-wasm/dist/lib/WASMInterface";

import { type ProjectModel } from "./data";

export const useDB = () => {
  // in case we ever do something different than one global instance,
  // we don't expose DB.instance directly and treat it like a hook.
  return DB.instance;
};

export type DbProject = ProjectModel & {
  id: string,
  source: {
    type: "new",
  } | {
    type: "bundle",
  } | {
    type: "internet",
    href: string,
  },
};

export class DB {
  static instance = new DB();

  private readonly persisted: Promise<boolean> = navigator.storage.persist();
  private readonly hasher: Promise<IHasher> = createSHA256();

  async isPersistent() {
    return await this.persisted;
  }

  async storageEstimate() {
    return await navigator.storage.estimate();
  }

  /**
   * Lists projects stored in the database.
   * @returns A list of all projects stored in the database.
   */
  async listProjects() {
    const db = await this.openDB();

    return await db.getAll("projects");
  }

  /**
   * Loads a project from the database.
   * @param id The UUID of the project.
   * @returns The project content, or undefined if there is no project found.
   */
  async loadProject(id: string) {
    const db = await this.openDB();

    return await db.get("projects", id);
  }

  /**
   * Stores a project in the database.
   *
   * The createDate and modifyDate fields in the provided project are automatically managed.
   * @param project The content of the project.
   */
  async storeProject(project: DbProject) {
    const db = await this.openDB();

    const prev = await db.get("projects", project.id);

    await db.put("projects", {
      ...project,
      createDate: prev?.createDate ?? new Date(),
      modifyDate: new Date(),
    });
  }

  async deleteProject(id: string) {
    const db = await this.openDB();

    await db.delete("projects", id);
  }

  async containsAsset(hash: string) {
    const db = await this.openDB();

    return await db.getKey("assets", hash) !== undefined;
  }

  async loadAsset(hash: string) {
    const db = await this.openDB();

    return await db.get("assets", hash);
  }

  async storeAsset(data: Blob) {
    const hash = await this.hashBlob(data);

    return await this.storeAssetWithHash(hash, data);
  }

  /**
   * Stores an asset assuming it has the given hash. You should only use this method if you are
   * reasonably certain that the hash is valid.
   * @param hash The precomputed hash of data.
   * @param data The asset data to store.
   * @returns The precomputed hash.
   */
  async storeAssetWithHash(hash: string, data: Blob) {
    const db = await this.openDB();

    return await db.put("assets", data, hash);
  }

  private async hashBlob(data: Blob) {
    const chunkSize = 1e6;

    const h = await this.hasher;
    h.init();

    let currentOffset = 0;
    while (currentOffset < data.size) {
      const chunk = data.slice(currentOffset, currentOffset + chunkSize);
      const buffer = await chunk.arrayBuffer();
      h.update(new Uint8Array(buffer));
      currentOffset += chunkSize;
    }

    return h.digest("hex");
  }

  private async openDB() {
    const dbName = "tourforge";
    const dbVersion = 1;

    interface Schema extends DBSchema {
      projects: {
        value: DbProject,
        key: string,
      },
      assets: {
        value: Blob,
        key: string,
      },
    }

    return await openDB<Schema>(dbName, dbVersion, {
      upgrade(db, oldVersion, newVersion) {
        if (!db.objectStoreNames.contains("projects")) {
          db.createObjectStore("projects", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("assets")) {
          db.createObjectStore("assets");
        }
      },
    });
  }
}
