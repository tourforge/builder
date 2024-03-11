import { createResource, type Component, For, createUniqueId, type JSX, Show } from "solid-js";
import { FiTrash, FiUpload, FiDownload, FiMusic, FiFile } from "solid-icons/fi";

import { useProject } from "../../hooks/Project";
import { useDB } from "../../db";
import { useAssetUrl } from "../../hooks/AssetUrl";

import styles from "./ProjectAssetsEditor.module.css";

export const ProjectAssetsEditor: Component = () => {
  const [project] = useProject();
  const assets = () => Object.keys(project()?.assets ?? []);

  return (
    <div class={styles.AssetsEditor}>
      <span class="hint">
        <Show when={assets()?.length === 0}>This project currently does not currently have any asset files.&nbsp;</Show>
        The Asset Editor allows you to manage existing assets. To add new assets, just edit a tour and upload files as necessary.
      </span>
      <div class={styles.AssetsList}>
        <For each={assets()}>
          {asset => <AssetCard asset={asset} />}
        </For>
      </div>
    </div>
  );
};

const AssetCard: Component<{ asset: string }> = (props) => {
  const fileInputId = createUniqueId();
  const db = useDB();
  const [project, setProject] = useProject();
  const assetUrl = useAssetUrl(project, () => props.asset);
  const [assetBlob] = createResource(() => props.asset, async asset => {
    if (asset === undefined) {
      return undefined;
    }
    const currentProject = project();
    if (currentProject === undefined) {
      return undefined;
    }
    if (currentProject.assets[asset] == null) {
      return undefined;
    }
    return await db.loadAsset(currentProject.assets[asset].hash);
  });
  const assetIsImage = () => assetBlob() != null ? ["image/jpeg", "image/png"].includes(assetBlob()!.type) : false;
  const assetIsAudio = () => assetBlob() != null ? ["audio/mpeg"].includes(assetBlob()!.type) : false;

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const files = event.currentTarget.files;
    if (files == null || files.length < 1) return;

    const file = files[0];
    const assetHash = await db.storeAsset(file);

    setProject(project => ({
      ...project,
      assets: {
        ...project.assets,
        [props.asset]: {
          alt: "",
          attrib: "",
          ...(props.asset in project.assets ? project.assets[props.asset] : {}),
          hash: assetHash,
        },
      },
    }));
  };

  const handleDownloadClick = async () => {
    window.open(assetUrl(), "_blank");
  };

  const handleUploadClick = async () => {
    document.getElementById(fileInputId)?.click();
  };

  const handleDeleteClick = async () => {
    if (confirm("Are you sure you want to delete this asset? This cannot be undone.")) {
      setProject(project => {
        const oldAssets = project.assets;
        const assetsClone = { ...oldAssets };
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete assetsClone[props.asset];
        return {
          ...project,
          assets: assetsClone,
        };
      });
    }
  };

  return (
    <div class={styles.AssetCard}>
      <Show when={assetIsImage()}>
        <img
          src={assetUrl()}
          class={styles.AssetThumbnail}
          onClick={() => window.open(assetUrl(), "_blank")}
        />
      </Show>
      <Show when={assetIsAudio()}>
        <div class={styles.AssetThumbnail} onClick={() => window.open(assetUrl(), "_blank")}>
          <FiMusic />
        </div>
      </Show>
      <Show when={!assetIsImage() && !assetIsAudio()}>
        <div class={styles.AssetThumbnail} onClick={() => window.open(assetUrl(), "_blank")}>
          <FiFile />
        </div>
      </Show>
      <div class={styles.AssetName}>{props.asset}</div>
      <div class={styles.AssetCardButtons}>
        <button class={styles.AssetButton} onClick={handleDownloadClick} title="Download Asset File"><FiDownload /></button>
        <button class={styles.AssetButton} onClick={handleUploadClick} title="Upload New Version"><FiUpload /></button>
        <button class={styles.AssetButton} onClick={handleDeleteClick} title="Delete Asset File"><FiTrash /></button>
      </div>
      <input type="file" style="display: none" id={fileInputId} onInput={handleFileInput} />
    </div>
  );
};
