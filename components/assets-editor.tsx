import { ChangeEvent, useEffect, useId, useState } from "react";

import { toast } from "react-toastify";

import { deleteAsset, getAssetAlt, getAssetAttrib, listAssets, setAssetAlt, setAssetAttrib } from "src/api";

import styles from "../styles/AssetsEditor.module.css";
import Modal from "./tour-editor/modal";

export default function AssetsEditor() {
  const [assets, setAssets] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string | undefined>();

  useEffect(() => {
    listAssets()
      .then(setAssets)
      .catch(err => {
        console.error("Failed to load assets list", err);
        toast.error(`Failed to load assets list: ${err}`);
      });
  }, [selectedAsset]);

  return (
    <div className={styles.AssetsEditor}>
      {assets.map(asset => (
        <button className={styles.asset} onClick={() => setSelectedAsset(asset)} key={asset}>
          {asset}
        </button>
      ))}
      <Modal isOpen={!!selectedAsset}>
        {selectedAsset
          ? <AssetPopup assetName={selectedAsset} onDone={() => setSelectedAsset(undefined)} />
          : null}
      </Modal>
    </div>
  );
}

function AssetPopup({ assetName, onDone }: { assetName: string, onDone: () => void }) {
  const id = useId();

  const [attrib, setAttrib] = useState<string | undefined>();
  const [alt, setAlt] = useState<string | undefined>();

  useEffect(() => {
    getAssetAttrib(assetName)
      .then(attrib => setAttrib(attrib))
      .catch(err => {
        console.error("Failed to load asset attrib", err);
        toast.error(`Failed to load attribution text: ${err}`);
      });

    getAssetAlt(assetName)
      .then(alt => setAlt(alt))
      .catch(err => {
        console.error("Failed to load asset alt", err);
        toast.error(`Failed to load alt text: ${err}`);
      });
  }, [assetName]);

  useEffect(() => {
    if (!attrib) return;

    setAssetAttrib(assetName, attrib).catch(err => {
      console.error("Failed to set asset attrib", err);
      toast.error(`Failed to update attribution text: ${err}`);
    });
  }, [assetName, attrib]);

  useEffect(() => {
    if (!alt) return;

    setAssetAlt(assetName, alt).catch(err => {
      console.error("Failed to set asset alt", err);
      toast.error(`Failed to update alt text: ${err}`);
    });
  }, [assetName, alt]);

  function handleDoneClick() {
    onDone();
  }

  async function handleDeleteClick() {
    try {
      await deleteAsset(assetName);
    } catch (e) {
      console.error("Failed to delete asset", e);
      toast.error(`Failed to delete asset: ${e}`);
    }
    onDone();
  }

  function handleAttribChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setAttrib(ev.target.value);
  }

  function handleAltChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setAlt(ev.target.value);
  }

  return (
    <>
      <div className="column">
        <label htmlFor={`${id}-attrib`} className="inline-label">Attribution</label>
        <textarea rows={3} name="name" id={`${id}-attrib`} onChange={handleAttribChange} value={attrib}>
        </textarea>
      </div>
      <div className="column">
        <label htmlFor={`${id}-alt`} className="inline-label">Alt Text</label>
        <textarea rows={3} name="name" id={`${id}-alt`} onChange={handleAltChange} value={alt}>
        </textarea>
      </div>
      <div className={styles.modalActionButtons}>
        <button className="danger" onClick={handleDeleteClick}>Delete</button>
        <button className="primary" onClick={handleDoneClick}>Done</button>
      </div>
    </>
  );
}
