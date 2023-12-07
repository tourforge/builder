import { createResource, type Component, For, createUniqueId, JSX, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { FiTrash, FiUpload, FiDownload, FiEdit } from "solid-icons/fi";

import { ApiAsset, ApiClient, useApiClient } from "../../api";

import styles from "./ProjectAssetsEditor.module.css";

export const ProjectAssetsEditor: Component = () => {
  const params = useParams();

  const api = useApiClient();
  const [assets, { refetch: refetchAssets }] = createResource(async () => await api.listAssets(params.pid));

  return (
    <div class={styles.AssetsEditor}>
      <span class="hint">
        <Show when={assets()?.length === 0}>This project currently does not currently have any asset files.&nbsp;</Show>
        The Asset Editor allows you to manage existing assets. To add new assets, just edit a tour and upload files as necessary.
      </span>
      <div class={styles.AssetsList}>
        <For each={assets()}>
          {asset => <AssetCard asset={asset} api={api} pid={params.pid} refetch={refetchAssets} />}
        </For>
      </div>
    </div>
  );
};

const AssetCard: Component<{ asset: ApiAsset, api: ApiClient, pid: string, refetch: () => void }> = (props) => {
  const fileInputId = createUniqueId();

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const files = event.currentTarget.files;
    if (!files || files.length < 1) return;

    const file = files[0];
    await props.api.updateAssetFile(props.pid, props.asset.id, file);
  };

  const handleDownloadClick = async () => {
    window.open(props.asset.file, "_blank");
  };

  const handleUploadClick = async () => {
    document.getElementById(fileInputId)?.click();
  };

  const handleDeleteClick = async () => {
    if (confirm("Are you sure you want to delete this asset? This cannot be undone.")) {
      await props.api.deleteAsset(props.pid, props.asset.id);
      props.refetch();
    }
  };

  return (
    <div class={styles.AssetCard}>
      <img
        src={props.asset.file}
        class={styles.AssetThumbnail}
        onClick={() => window.open(props.asset.file, "_blank")}
      />
      <div class={styles.AssetName}>{props.asset.name}</div>
      <div class={styles.AssetCardButtons}>
        <button class={styles.AssetButton} onClick={handleDownloadClick} title="Download Asset File"><FiDownload /></button>
        <button class={styles.AssetButton} onClick={handleUploadClick} title="Upload New Version"><FiUpload /></button>
        <button class={styles.AssetButton} onClick={handleDeleteClick} title="Delete Asset File"><FiTrash /></button>
      </div>
      <input type="file" style="display: none" id={fileInputId} onInput={handleFileInput} />
    </div>
  );
};