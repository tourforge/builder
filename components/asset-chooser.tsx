import { ChangeEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { listAssets, AssetKind, importAsset, ChosenFile, chooseFile } from "../src/api";
import Modal from "react-modal";

import styles from "../styles/AssetChooser.module.css";
import { FaFileImport } from "react-icons/fa";

export default function AssetChooser({ name, kind }: { name: string, kind: AssetKind }) {
  const id = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const [newAssetFile, setNewAssetFile] = useState<ChosenFile | null>(null);
  const [newAssetName, setNewAssetName] = useState<string>("");

  useEffect(() => {
    listAssets(inputValue, kind).then(setResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInputChange(ev: ChangeEvent<HTMLInputElement>) {
    setInputValue(ev.target.value);

    listAssets(ev.target.value, kind).then(setResults);
  }

  function handleInputKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      (resultsRef.current?.firstChild as HTMLButtonElement | null)?.focus();
    }
  }

  function handleResultKeyDown(ev: KeyboardEvent<HTMLButtonElement>) {
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      (ev.currentTarget.nextElementSibling as HTMLButtonElement | null)?.focus();
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      const prev = ev.currentTarget.previousElementSibling as HTMLButtonElement | null;
      if (prev !== null)
        prev.focus();
      else
        inputRef.current?.focus();
    }
  }

  function handleResultClick(result: string) {
    setInputValue(result);
    setResults([]);
    inputRef.current?.focus();
  }

  function handleFileImportButtonClick() {
    chooseFile().then(setNewAssetFile);
  }

  function handleNewAssetNameChange(ev: ChangeEvent<HTMLInputElement>) {
    setNewAssetName(ev.target.value);
  }

  function handleImportCancelButtonClick() {
    setNewAssetFile(null);
    setNewAssetName("");
  }

  async function handleImportButtonClick() {
    if (!newAssetFile) return;

    const name = newAssetName + newAssetFile.extension();

    await importAsset(newAssetFile, name);

    setNewAssetFile(null);
    setNewAssetName("");
    setInputValue(name);
    setResults([]);
  }

  return (
    <div className={`${styles.AssetChooser} ${results.length != 0 ? styles.hasResults : ""}`}>
      <label htmlFor={id} className="inline-label">{name}</label>
      <div className={styles.assetNameContainer}>
        <div className={styles.assetNameContainerInner}>
          <input
            type="text"
            name={name}
            placeholder="Asset Name"
            id={id}
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
          />
          <div className={styles.autoCompleteBox} ref={resultsRef}>
            {results.map(result => (
              <button
                className={styles.autoCompleteItem}
                key={result}
                onClick={() => handleResultClick(result)}
                onKeyDown={handleResultKeyDown}
              >
                {result}
              </button>
            ))}
          </div>
        </div>
        <button className="primary" onClick={handleFileImportButtonClick}>
          <FaFileImport />
        </button>
      </div>
      <Modal isOpen={!!newAssetFile} className={styles.modalContent} overlayClassName={styles.modalOverlay}>
          <header>Importing a new asset</header>
          Choose a name for the new asset you&apos;re importing.
          <div style={{height: 10}}></div>
          <label htmlFor={`${id}-modal-name`} className="inline-label">Asset Name</label>
          <div className={`input-wrapper ${styles.modalInputWrapper}`}>
            <input type="text" name="name" id={`${id}-modal-name`} onChange={handleNewAssetNameChange} />
            <span>{newAssetFile?.extension()}</span>
          </div>
          <div style={{height: 5}}></div>
          <div className={styles.modalActionButtons}>
            <button className="secondary" onClick={handleImportCancelButtonClick}>Cancel</button>
            <button className="primary" onClick={handleImportButtonClick}>Import</button>
          </div>
      </Modal>
    </div>
  );
}
