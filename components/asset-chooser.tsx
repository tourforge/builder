import { ChangeEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { listAssets, AssetKind } from "../src/api";
import Modal from "react-modal";

import styles from "../styles/AssetChooser.module.css";

export default function AssetChooser({ name, kind }: { name: string, kind: AssetKind }) {
  const id = useId();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

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

  return (
    <div
      className={`${styles.AssetChooser} ${results.length != 0 ? styles.hasResults : ""}`}>
      <label htmlFor={id} className="inline-label">{name}</label>
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
      <Modal isOpen={true} className={styles.modalContent} overlayClassName={styles.modalOverlay}>
          <header>Importing a new asset</header>
          Choose a name for the new asset you&apos;re importing.
          <div style={{height: 15}}></div>
          <label htmlFor={`${id}-modal-name`} className="inline-label">Asset Name</label>
          <input type="text" name="name" id={`${id}-modal-name`} />
      </Modal>
    </div>
  );
}
