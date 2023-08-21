import { Component, createEffect, createResource, JSX, For, createUniqueId, createSignal, Index, Show } from "solid-js";
import { FiArrowDown, FiArrowUp, FiImage, FiTrash, FiUpload } from "solid-icons/fi";

import { GalleryModel } from "./data";
import { ApiAsset, useApiClient } from "./api";

import styles from "./Gallery.module.css";

export const Gallery: Component<{
  id?: string | undefined,
  pid: string,
  value: GalleryModel,
  onChange: (newValue: GalleryModel) => void,
}> = (props) => {
  const api = useApiClient();
  const [assets, { refetch: refetchAssets }] = createResource(async () => await api.getAssets(props.pid, props.value));

  const handleAddImageClick = () => {
    props.onChange([...props.value, ""]);
  };

  const handleAssetIdChange = (index: number) => (newId: string) => {
    props.onChange([...props.value.slice(0, index), newId, ...props.value.slice(index + 1)]);
  };

  const handleUploadClick = (asset: ApiAsset | undefined, i: number) => async (query: string, file: File) => {
    if (asset?.name === query) {
      await api.updateAssetFile(props.pid, asset.id, file);
    } else {
      await api.createAsset(props.pid, query, file);
    }

    refetchAssets();
  };

  const handleDeleteClick = (i: number) => () => {
    props.onChange([...props.value.slice(0, i), ...props.value.slice(i + 1)]);
  };

  const handleUpClick = (i: number) => () => {

  };

  const handleDownClick = (i: number) => () => {

  };

  createEffect((oldValue: GalleryModel) => {
    if (props.value !== oldValue) {
      refetchAssets();
    }

    return props.value;
  }, props.value);

  return (
    <div class={styles.Gallery} id={props.id}>
      <Index each={assets()}>
        {(asset, i) => (
          <GalleryItem
            pid={props.pid}
            asset={asset()}
            onIdChange={handleAssetIdChange(i)}
            onUploadClick={handleUploadClick(asset(), i)}
            onDeleteClick={handleDeleteClick(i)}
            onUpClick={handleUpClick(i)}
            onDownClick={handleDownClick(i)}
          />
        )}
      </Index>
      <button class="primary" onClick={handleAddImageClick}>Add Image</button>
    </div>
  );
};

const GalleryItem: Component<{
  pid: string,
  asset: ApiAsset | undefined,
  onIdChange: (newId: string) => void,
  onUploadClick: (query: string, file: File) => void,
  onDeleteClick: () => void,
  onUpClick: () => void,
  onDownClick: () => void,
}> = (props) => {
  const datalistId = createUniqueId();
  const fileInputId = createUniqueId();
  const api = useApiClient();
  const [imageLoaded, setImageLoaded] = createSignal(false);
  const [query, setQuery] = createSignal(props.asset?.name ?? "");
  const [assets] = createResource(async () => await api.listAssets(props.pid), { });

  const resolved = () => props.asset?.name === query();

  const handleQueryInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newQuery = event.currentTarget.value;
    setQuery(newQuery);

    const match = assets()?.find(asset => asset.name === newQuery);
    if (match) {
      props.onIdChange(match.id);
    }
  };

  const handleFileInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const files = event.currentTarget.files;
    if (files && files.length >= 1) {
      props.onUploadClick(query(), files[0]);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  createEffect((oldAssetId) => {
    if (oldAssetId !== props.asset?.id) {
      setQuery(props.asset?.name ?? "");
    }

    return props.asset?.id;
  }, props.asset?.id);



  return (
    <div class={styles.GalleryItem}>
      <img
        src={props.asset?.file}
        class={styles.GalleryItemThumbnail}
        classList={{ [styles.Error]: !imageLoaded() }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      <Show when={!imageLoaded()}>
        <div title="Image not found" class={styles.GalleryItemThumbnail}><FiImage /></div>
      </Show>
      <input class={styles.GalleryItemInput} type="text" value={query()} onInput={handleQueryInput} placeholder="Type a name here..." list={datalistId} />
      <datalist id={datalistId}>
        <For each={assets()}>
          {(asset) => <option value={asset.name} />}
        </For>
      </datalist>
      <button class={styles.GalleryItemButton} title="Move Up" onClick={props.onUpClick}><FiArrowUp /></button>
      <button class={styles.GalleryItemButton} title="Move Down" onClick={props.onDownClick}><FiArrowDown /></button>
      <button class={styles.GalleryItemButton} title={resolved() ? "Change Image" : "Create New Asset"} onClick={() => document.getElementById(fileInputId)?.click()}><FiUpload /></button>
      <button class={styles.GalleryItemButton} title="Remove Item" onClick={props.onDeleteClick}><FiTrash /></button>
      <input type="file" style="display: none" id={fileInputId} onInput={handleFileInput} />
    </div>
  );
};