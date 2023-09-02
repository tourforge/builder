import { Component, createEffect, createResource, JSX, For, createUniqueId, createSignal, Index, Show } from "solid-js";
import { FiArrowDown, FiArrowUp, FiImage, FiTrash, FiUpload } from "solid-icons/fi";

import { GalleryModel } from "../data";
import { ApiAsset, useApiClient } from "../api";

import styles from "./Gallery.module.css";
import { Asset } from "./Asset";

export const Gallery: Component<{
  id?: string | undefined,
  pid: string,
  value: GalleryModel,
  onChange: (newValue: GalleryModel) => void,
}> = (props) => {
  const api = useApiClient();

  const handleAddImageClick = () => {
    props.onChange([...props.value, ""]);
  };

  const handleAssetIdChange = (index: number) => (newId: string) => {
    props.onChange([...props.value.slice(0, index), newId, ...props.value.slice(index + 1)]);
  };

  const handleDeleteClick = (i: number) => () => {
    props.onChange([...props.value.slice(0, i), ...props.value.slice(i + 1)]);
  };

  const handleUpClick = (i: number) => () => {

  };

  const handleDownClick = (i: number) => () => {

  };

  return (
    <div class={styles.Gallery} id={props.id}>
      <Index each={props.value}>
        {(asset, i) => (
          <Asset
            pid={props.pid}
            asset={asset()}
            onIdChange={handleAssetIdChange(i)}
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
