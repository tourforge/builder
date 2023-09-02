import { FiArrowDown, FiArrowUp, FiImage, FiTrash, FiUpload } from "solid-icons/fi";
import { Component, createEffect, createResource, createSignal, createUniqueId, For, JSX, Show } from "solid-js";

import { ApiAsset, useApiClient } from "../api";

import styles from "./Asset.module.css";

export const Asset: Component<{
  id?: string,
  pid: string,
  asset: string | undefined,
  onIdChange: (newId: string) => void,
  onDeleteClick?: () => void,
  onUpClick?: () => void,
  onDownClick?: () => void,
}> = (props) => {
  const datalistId = createUniqueId();
  const fileInputId = createUniqueId();
  const api = useApiClient();
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [assets, { refetch: refetchAssets }] = createResource(async () => await api.listAssets(props.pid), { });
  const [query, setQuery] = createSignal("");
  const asset = () => assets()?.find(a => a.id === props.asset);

  const resolved = () => asset()?.name === query();

  const handleQueryInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newQuery = event.currentTarget.value;
    setQuery(newQuery);

    const match = assets()?.find(asset => asset.name === newQuery);
    if (match) {
      props.onIdChange(match.id);
    }
  };

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const files = event.currentTarget.files;
    if (!files || files.length < 1) return;

    const file = files[0];
    if (asset()?.name === query()) {
      await api.updateAssetFile(props.pid, asset()!.id, file);
    } else {
      props.onIdChange((await api.createAsset(props.pid, query(), file)).id);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  createEffect((oldLoading) => {
    if (oldLoading && !assets.loading && query() === "") {
      setQuery(asset()?.name ?? "");
    }

    return assets.loading;
  }, assets.loading);

  createEffect((oldAsset) => {
    if (oldAsset !== props.asset && props.asset !== undefined) {
      refetchAssets();
    }

    return props.asset;
  }, props.asset);

  return (
    <div id={props.id} class={styles.Asset}>
      <img
        src={asset()?.file}
        class={styles.AssetThumbnail}
        classList={{ [styles.Error]: !imageLoaded() }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      <Show when={!imageLoaded()}>
        <div title="Image not found" class={styles.AssetThumbnail}><FiImage /></div>
      </Show>
      <input class={styles.AssetInput} type="text" value={query()} onInput={handleQueryInput} placeholder="Type a name here..." list={datalistId} />
      <datalist id={datalistId}>
        <For each={assets()}>
          {(asset) => <option value={asset.name} />}
        </For>
      </datalist>
      <Show when={props.onUpClick}>
        <button class={styles.AssetButton} title="Move Up" onClick={props.onUpClick}><FiArrowUp /></button>
      </Show>
      <Show when={props.onDownClick}>
        <button class={styles.AssetButton} title="Move Down" onClick={props.onDownClick}><FiArrowDown /></button>
      </Show>
      <button class={styles.AssetButton} title={resolved() ? "Change Image" : "Create New Asset"} onClick={() => document.getElementById(fileInputId)?.click()}><FiUpload /></button>
      <Show when={props.onDeleteClick}>
        <button class={styles.AssetButton} title="Remove Item" onClick={props.onDeleteClick}><FiTrash /></button>
      </Show>
      <input type="file" style="display: none" id={fileInputId} onInput={handleFileInput} />
    </div>
  );
};