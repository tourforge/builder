import { type Component, Show, type JSX } from "solid-js";

import { type ControlPointModel } from "../../data";
import { Field } from "../../components/Field";
import { LatLngEditor } from "../../components/LatLngEditor";

import styles from "./ControlPointEditorPanel.module.css";

export const ControlPointEditorPanel: Component<{ controlPoint: () => ControlPointModel | undefined, onChange: (newControlPoint: ControlPointModel) => void }> = (props) => {
  const handleLocationChange = (lat: number, lng: number) => {
    if (lat === props.controlPoint()!.lat && lng === props.controlPoint()!.lng) {
      return;
    }

    props.onChange(({ ...props.controlPoint()!, lat, lng }));
  };

  const handleControlTypeInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    if (!ev.currentTarget.checked) return;

    const control = ev.currentTarget.value;
    if (control === "path" || control === "route") {
      props.onChange(({ ...props.controlPoint()!, control }));
    } else {
      console.error("Unexpected value:", control);
    }
  };

  return (
    <Show when={props.controlPoint()}>
      <div class={styles.ControlPointEditorPanel}>
        <Field>
          {(id) => (
            <LatLngEditor
              id={id}
              lat={props.controlPoint()!.lat}
              lng={props.controlPoint()!.lng}
              onChange={handleLocationChange}
            />
          )}
        </Field>
        <Field set label="Control Type">
          {(id) => (<>
            <div>
              <input
                type="radio"
                id={`${id}-path`}
                value="path"
                checked={props.controlPoint()!.control === "path"}
                onInput={handleControlTypeInput}
              />
              <label for={`${id}-path`}>Path</label>
            </div>
            <div>
              <input
                type="radio"
                id={`${id}-route`}
                value="route"
                checked={props.controlPoint()!.control === "route"}
                onInput={handleControlTypeInput}
              />
              <label for={`${id}-route`}>Route</label>
            </div>
          </>)}
        </Field>
      </div>
    </Show>
  );
};
