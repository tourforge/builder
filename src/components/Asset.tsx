import { FiArrowDown, FiArrowUp, FiImage, FiMusic, FiTrash, FiUpload } from "solid-icons/fi";
import { Component, createSignal, createUniqueId, For, JSX, Show } from "solid-js";

import styles from "./Asset.module.css";
import { useDB } from "../db";
import { useProject } from "../hooks/Project";
import { useAssetUrl } from "../hooks/AssetUrl";

export const Asset: Component<{
  id?: string,
  type: "image" | "audio",
  asset: string | undefined,
  onIdChange: (newId: string) => void,
  onDeleteClick?: () => void,
  onUpClick?: () => void,
  onDownClick?: () => void,
}> = (props) => {
  const datalistId = createUniqueId();
  const fileInputId = createUniqueId();

  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [query, setQuery] = createSignal(props.asset);

  const db = useDB();
  const [project, setProject] = useProject();
  const assetUrl = useAssetUrl(project, () => props.asset);

  const assets = () => Object.keys(project()?.assets ?? {});

  const handleQueryInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newQuery = event.currentTarget.value;
    setQuery(newQuery);

    const match = assets().find(asset => asset === newQuery);
    if (match) {
      props.onIdChange(match);
    }
  };

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    if (project() === undefined) {
      return;
    }

    const assetName = query();
    if (!assetName) {
      alert("Cannot upload asset with empty name.");
      return;
    }
  
    const files = event.currentTarget.files;
    if (!files || files.length < 1) return;

    const file = files[0];
    let assetHash: string;
    assetHash = await db.storeAsset(file);

    setProject(project => ({
      ...project,
      assets: {
        ...project.assets,
        [assetName]: {
          alt: "",
          attrib: "",
          ...(assetName in project.assets ? project.assets[assetName] : {}),
          hash: assetHash,
        },
      }
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

  return (
    <div id={props.id} class={styles.Asset}>
      <Show when={props.type === "image"}>
        <img
          src={assetUrl()}
          class={styles.AssetThumbnail}
          classList={{ [styles.Error]: !imageLoaded() }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => window.open(assetUrl(), "_blank")}
        />
        <Show when={!imageLoaded()}>
          <div title="Image not found" class={styles.AssetThumbnail} onClick={() => window.open(assetUrl(), "_blank")}><FiImage /></div>
        </Show>
      </Show>
      <Show when={props.type === "audio"}>
        <div class={styles.AssetThumbnail} onClick={() => window.open(assetUrl(), "_blank")}><FiMusic /></div>
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