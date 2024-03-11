import { type Component, Index } from "solid-js";

import { type GalleryModel } from "../data";

import { Asset } from "./Asset";
import styles from "./Gallery.module.css";

export const Gallery: Component<{
  id?: string | undefined,
  value: GalleryModel,
  onChange: (newValue: GalleryModel) => void,
}> = (props) => {
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
    if (i <= 0 || i >= props.value.length) {
      return;
    }
    props.onChange([...props.value.slice(0, i - 1), props.value[i], props.value[i - 1], ...props.value.slice(i + 1)]);
  };

  const handleDownClick = (i: number) => () => {
    if (i < 0 || i >= props.value.length - 1) {
      return;
    }
    props.onChange([...props.value.slice(0, i), props.value[i + 1], props.value[i], ...props.value.slice(i + 2)]);
  };

  return (
    <div class={styles.Gallery} id={props.id}>
      <Index each={props.value}>
        {(asset, i) => (
          <Asset
            asset={asset()}
            type="image"
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
