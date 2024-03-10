import { openDB, DBSchema } from 'idb';
import { createSHA256, sha256 } from 'hash-wasm';

import { AssetType, ProjectModel } from './data';
import { IHasher } from 'hash-wasm/dist/lib/WASMInterface';

export const useDB = () => {
  // in case we ever do something different than one global instance,
  // we don't expose DB.instance directly and treat it like a hook.
  return DB.instance;
}

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

  private persisted: Promise<boolean> = navigator.storage.persist();
  private hasher: Promise<IHasher> = createSHA256();

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
   * @param project The content of the project.
   */
  async storeProject(project: DbProject) {
    const db = await this.openDB();

    await db.put("projects", project);
  }

  async loadAsset(hash: string) {
    const db = await this.openDB();

    return await db.get("assets", hash);
  }

  async storeAsset(data: Blob) {
    const hash = await this.hashBlob(data);

    const db = await this.openDB();

    return await db.put("assets", data, hash)
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

    return h.digest('hex');
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
      }
    });
  }
}