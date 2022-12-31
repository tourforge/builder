/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { SetterOrUpdater } from "recoil";

import { imageAssetUrl } from "../src/api";
import { replaceElementAtIndex } from "../src/state";

import styles from "../styles/GalleryEditor.module.css";
import AssetChooser from "./asset-chooser";
import Modal from "./modal";

export default function GalleryEditor({ gallery, setGallery }: {
  gallery: string[],
  setGallery: SetterOrUpdater<string[]>,
}) {
  const [openItem, setOpenItem] = useState<number | "new" | undefined>();
  const [openItemChosenAsset, setOpenItemChosenAsset] = useState<string | undefined>();

  function handleAddButtonClick() {
    setOpenItem("new");
  }

  function handleGalleryItemClick(index: number) {
    setOpenItem(index);
    setOpenItemChosenAsset(gallery[index]);
  }

  function handleModalCancelButtonClick() {
    setOpenItem(undefined);
    setOpenItemChosenAsset(undefined);
  }

  function handleModalDoneButtonClick() {
    setOpenItem(undefined);

    if (!openItemChosenAsset) return;

    if (openItem == "new") {
      setGallery([...gallery, openItemChosenAsset]);
    } else if (typeof openItem === "number") {
      setGallery(replaceElementAtIndex(gallery, openItem, openItemChosenAsset));
    }

    setOpenItemChosenAsset(undefined);
  }

  return (
    <div className={styles.GalleryEditor}>
      <label>Gallery</label>
      <div className={`${styles.items}`}>
        {gallery.map((item, index) => <GalleryItem key={item} item={item} onClick={() => handleGalleryItemClick(index)} />)}
        <button className="secondary" onClick={handleAddButtonClick}>Add</button>
        <Modal isOpen={typeof openItem !== "undefined"}>
          <header>Gallery image</header>
          Choose an asset for this image in the gallery.
          <AssetChooser name="Gallery image" kind="image" defaultValue={openItemChosenAsset} onChange={setOpenItemChosenAsset} />
          <div className={styles.modalActionButtons}>
            <button className="secondary" onClick={handleModalCancelButtonClick}>Cancel</button>
            <button className="primary" onClick={handleModalDoneButtonClick}>Save</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

function GalleryItem({ item, onClick }: { item: string, onClick: () => void }) {
  const [url, setUrl] = useState<string | null>();

  useEffect(() => {
    imageAssetUrl(item)
      .then(url => setUrl(url))
      .catch(console.error);
  }, [item]);

  if (url) {
    return <button className={styles.GalleryItem} onClick={onClick}><img src={url} alt="Image asset" /></button>;
  } else {
    return <></>;
  }
}
