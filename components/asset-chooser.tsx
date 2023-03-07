import { ChangeEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { FaFileImport } from "react-icons/fa";
import { toast } from "react-toastify";

import { AssetKind, chooseFile, ChosenFile, importAsset, listAssets } from "src/api";

import Modal from "./modal";

import styles from "styles/tour-editor/AssetChooser.module.css";

export default function AssetChooser({ name, kind, value, onChange = () => {} }: {
  name: string,
  kind: AssetKind,
  value?: string | undefined,
  onChange?: (value: string) => void,
}) {
  const id = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState(value ?? "");

  const [newAssetFile, setNewAssetFile] = useState<ChosenFile | null>(null);

  useEffect(() => {
    setInputValue(value ?? "");
  }, [value]);

  useEffect(() => {
    listAssets(inputValue, kind)
      .then(setResults)
      .catch(err => {
        console.error(err);
        toast.error("Failed to get the assets list!");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleInputChange(ev: ChangeEvent<HTMLInputElement>) {
    if (value === undefined)
      setInputValue(ev.target.value);

    onChange(ev.target.value);

    listAssets(ev.target.value, kind)
      .then(setResults)
      .catch(err => {
        console.error(err);
      });
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
    if (value === undefined)
      setInputValue(result);
    onChange(result);
    setResults([]);
    inputRef.current?.focus();
  }

  function handleFileImportButtonClick() {
    chooseFile()
      .then(setNewAssetFile)
      .catch(err => {
        console.error(err);
        toast.error("Choosing file failed!");
      });
  }

  function handleImportModalCancel() {
    setNewAssetFile(null);
  }

  function handleImportModalFinish(name: string) {
    setNewAssetFile(null);
    setInputValue(name);
    onChange(name);
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
      <Modal isOpen={!!newAssetFile}>
          {!!newAssetFile
            ? <ImportModal
                newAssetFile={newAssetFile}
                onCancel={handleImportModalCancel}
                onFinish={handleImportModalFinish}
              />
            : null}
      </Modal>
    </div>
  );
}

function ImportModal({ newAssetFile, onCancel, onFinish }: {
  newAssetFile: ChosenFile,
  onCancel: () => void,
  onFinish: (name: string) => void,
}) {
  const id = useId();

  const [newAssetName, setNewAssetName] = useState<string>("");

  function handleNewAssetNameChange(ev: ChangeEvent<HTMLInputElement>) {
    setNewAssetName(ev.target.value);
  }

  function handleImportCancelButtonClick() {
    onCancel();
  }

  async function handleImportButtonClick() {
    if (!newAssetFile) return;

    const name = newAssetName + newAssetFile.extension();

    try {
      await importAsset(newAssetFile, name);
      onFinish(name);
    } catch (err) {
      console.error(err);
      toast.error(`Asset import failed! ${err}`);
    }
  }

  return (
    <>
      <header>Importing a new asset</header>
      Choose a name for the new asset you&apos;re importing.
      <div className="column">
        <label htmlFor={`${id}-modal-name`} className="inline-label">Asset Name</label>
        <div className={`input-wrapper ${styles.modalInputWrapper}`}>
          <input type="text" name="name" id={`${id}-modal-name`} onChange={handleNewAssetNameChange} />
          <span>{newAssetFile?.extension()}</span>
        </div>
      </div>
      <div className={styles.modalActionButtons}>
        <button className="secondary" onClick={handleImportCancelButtonClick}>Cancel</button>
        <button className="primary" onClick={handleImportButtonClick}>Import</button>
      </div>
    </>
  );
}
