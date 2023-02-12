import { ChangeEvent, useEffect, useId, useState } from "react";

import { toast } from "react-toastify";

import { deleteAsset, getAssetMeta, listAssets, setAssetMeta } from "src/api";
import { AssetMeta } from "src/data";

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

  const [meta, setMeta] = useState<AssetMeta | undefined>();

  useEffect(() => {
    getAssetMeta(assetName)
      .then(meta => setMeta(meta))
      .catch(err => {
        console.error("Failed to load asset metadata", err);
        toast.error(`Failed to load metadata: ${err}`);
      });
  }, [assetName]);

  useEffect(() => {
    if (!meta) return;

    setAssetMeta(assetName, meta).catch(err => {
      console.error("Failed to set asset metadata", err);
      toast.error(`Failed to update metadata: ${err}`);
    });
  }, [assetName, meta]);

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
    setMeta(meta => ({ ...meta, attrib: ev.target.value }));
  }

  function handleAltChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setMeta(meta => ({ ...meta, alt: ev.target.value }));
  }

  return (
    <>
      <div className="column">
        <label htmlFor={`${id}-attrib`} className="inline-label">Attribution</label>
        <textarea rows={3} name="name" id={`${id}-attrib`} onChange={handleAttribChange} value={meta?.attrib}>
        </textarea>
      </div>
      <div className="column">
        <label htmlFor={`${id}-alt`} className="inline-label">Alt Text</label>
        <textarea rows={3} name="name" id={`${id}-alt`} onChange={handleAltChange} value={meta?.alt}>
        </textarea>
      </div>
      <div className={styles.modalActionButtons}>
        <button className="danger" onClick={handleDeleteClick}>Delete</button>
        <button className="primary" onClick={handleDoneClick}>Done</button>
      </div>
    </>
  );
}
