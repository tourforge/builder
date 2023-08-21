import { createUniqueId, type Component, JSX } from "solid-js";

import styles from "./Field.module.css";

export const Field: Component<{ label: JSX.Element, children: (id: string) => JSX.Element }> = ({ label, children }) => {
  const id = createUniqueId();

  return <div class={styles.Field}>
    <label for={id}>{label}</label>
    {children(id)}
  </div>
};