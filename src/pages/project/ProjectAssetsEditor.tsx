import { createResource, type Component, For, createUniqueId, JSX, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { FiTrash, FiUpload, FiDownload, FiMusic } from "solid-icons/fi";

import styles from "./ProjectAssetsEditor.module.css";
import { useProject } from "../../hooks/Project";
import { useDB } from "../../db";

export const ProjectAssetsEditor: Component = () => {
  const params = useParams();

  const [project] = useProject()
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
  const [assetBlob] = createResource(() => props.asset, asset => {
    if (asset === undefined) {
      return undefined;
    }
    const currentProject = project();
    if (currentProject === undefined) {
      return undefined;
    }
    if (!currentProject.assets[asset]) {
      return undefined;
    }
    return db.loadAsset(currentProject.assets[asset].hash).then(r => {
      console.log(r);
      return r;
    })
  });
  const assetIsImage = () => assetBlob() ? ["image/jpeg", "image/png"].includes(assetBlob()!.type) : false;
  const assetIsAudio = () => assetBlob() ? ["audio/mpeg"].includes(assetBlob()!.type) : false;
  const assetUrl = () => assetBlob() ? URL.createObjectURL(assetBlob()!) : undefined;

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    if (project() === undefined) {
      return;
    }
  
    const files = event.currentTarget.files;
    if (!files || files.length < 1) return;

    const file = files[0];
    let assetHash: string;
    try {
      assetHash = await db.storeAsset(file);
    } catch (e) {
      alert(`Failed to update asset. The storage alloted to this site by your web browser may have become full.`)
      console.error("Failed to add asset", e);
      return;
    }

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
      }
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
        const assetsClone = {...oldAssets};
        delete assetsClone[props.asset];
        return {
          ...project,
          assets: assetsClone,
        }
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