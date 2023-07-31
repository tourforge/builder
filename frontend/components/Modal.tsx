import React from "react";

import ReactModal from "react-modal";

import styles from "styles/Modal.module.css";

export default function Modal({ isOpen, children }: { isOpen: boolean, children?: React.ReactNode }) {
  return (
    <ReactModal isOpen={isOpen} className={styles.content} overlayClassName={styles.overlay}>
      {children}
    </ReactModal>
  );
}
