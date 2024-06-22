import { FiArrowDown, FiArrowUp, FiImage, FiMap, FiMic, FiTrash, FiUpload } from "solid-icons/fi";
import { type Component, createSignal, createUniqueId, For, type JSX, Show, createEffect } from "solid-js";

import { useDB } from "../db";
import { useProject } from "../hooks/Project";
import { useAssetUrl } from "../hooks/AssetUrl";
import { type AssetType } from "../data";

import styles from "./Asset.module.css";

export const Asset: Component<{
  id?: string,
  type: AssetType,
  assetIdentity?: string,
  asset: string | undefined,
  onIdChange: (newId: string) => void,
  onDeleteClick?: () => void,
  onUpClick?: () => void,
  onDownClick?: () => void,
}> = (props) => {
  const datalistId = createUniqueId();
  const fileInputId = createUniqueId();

  const db = useDB();
  const [project, setProject] = useProject();
  const [imageLoaded, setImageLoaded] = createSignal(false);

  const assetUrl = useAssetUrl(project, () => props.asset);

  const assets = () => Object.keys(project()?.assets ?? {}).filter(a => project()?.assets[a]?.type === props.type);

  const [query, setQuery] = createSignal("");

  createEffect(() => {
    ((_) => {})(props.assetIdentity);

    if (project() != null && props.asset != null) {
      // If the project is accessible when the component is constructed,
      // we can make sure the initial query only contains props.asset if
      // props.asset is actually a valid asset. This is useful behavior
      // in the case that an asset is deleted, because it makes the asset
      // field blank when it references an invalid (deleted) asset.
      if (assets().includes(props.asset)) {
        setQuery(props.asset);
      } else {
        setQuery("");
      }
    } else {
      setQuery(props.asset ?? "");
    }
  });

  const handleQueryInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newQuery = event.currentTarget.value;
    setQuery(newQuery);

    const match = assets().find(asset => asset === newQuery);
    if (match != null) {
      props.onIdChange(match);
    }
  };

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    if (project() === undefined) {
      return;
    }

    const assetName = query();
    if (assetName === "") {
      alert("Cannot upload asset with empty name.");
      return;
    }

    const files = event.currentTarget.files;
    if (files == null || files.length < 1) return;

    const file = files[0];
    const assetHash = await db.storeAsset(file);

    setProject(project => ({
      ...project,
      assets: {
        ...project.assets,
        [assetName]: {
          alt: "",
          attrib: "",
          type: props.type,
          ...(assetName in project.assets ? project.assets[assetName] : {}),
          hash: assetHash,
        },
      },
    }));

    if (props.asset !== assetName) {
      props.onIdChange(assetName);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  const handleAssetClick = () => {
    if (assetUrl() != null) {
      window.open(assetUrl(), "_blank");
    }
  };

  return (
    <div id={props.id} class={styles.Asset} classList={{ [styles.AssetResolved]: props.asset === query() && assetUrl() != null }}>
      <Show when={props.type === "image"}>
        <img
          src={props.asset === query() ? assetUrl() : ""}
          class={styles.AssetThumbnail}
          classList={{ [styles.Error]: !imageLoaded() }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={handleAssetClick}
        />
        <Show when={!imageLoaded() || props.asset !== query()}>
          <div title="Image not found" class={styles.AssetThumbnail} onClick={() => window.open(assetUrl(), "_blank")}><FiImage /></div>
        </Show>
      </Show>
      <Show when={props.type === "audio"}>
        <div class={styles.AssetThumbnail} onClick={handleAssetClick}><FiMic size={24.0} /></div>
      </Show>
      <Show when={props.type === "tiles"}>
        <div class={styles.AssetThumbnail} onClick={handleAssetClick}><FiMap size={24.0} /></div>
      </Show>
      <input class={styles.AssetInput} type="text" value={query()} onInput={handleQueryInput} placeholder="Type a name here..." list={datalistId} />
      <datalist id={datalistId}>
        <For each={assets()}>
          {(asset) => <option value={asset} />}
        </For>
      </datalist>
      <Show when={props.onUpClick}>
        <button class={styles.AssetButton} title="Move Up" onClick={props.onUpClick}><FiArrowUp /></button>
      </Show>
      <Show when={props.onDownClick}>
        <button class={styles.AssetButton} title="Move Down" onClick={props.onDownClick}><FiArrowDown /></button>
      </Show>
      <button class={styles.AssetButton} title={"Upload New Asset"} onClick={() => document.getElementById(fileInputId)?.click()}><FiUpload /></button>
      <Show when={props.onDeleteClick}>
        <button class={styles.AssetButton} title="Remove Item" onClick={props.onDeleteClick}><FiTrash /></button>
      </Show>
      <input type="file" style="display: none" id={fileInputId} onInput={handleFileInput} />
    </div>
  );
};
