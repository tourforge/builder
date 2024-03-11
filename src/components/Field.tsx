import { createUniqueId, type Component, type JSX, Show } from "solid-js";

import styles from "./Field.module.css";

export const Field: Component<{ set?: boolean, label?: JSX.Element, children: (id: string) => JSX.Element }> = (props) => {
  const id = createUniqueId();

  if (props.set === true) {
    return (
      <fieldset class={styles.Field}>
        <Show when={props.label}>
          <legend class={styles.FieldLabel}>{props.label}</legend>
        </Show>
        {props.children(id)}
      </fieldset>
    );
  } else {
    return (
      <div class={styles.Field}>
        <Show when={props.label}>
          <label class={styles.FieldLabel} for={id}>{props.label}</label>
        </Show>
        {props.children(id)}
      </div>
    );
  }
};
