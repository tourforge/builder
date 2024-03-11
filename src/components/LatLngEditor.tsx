import { Component, createEffect, createSignal, JSX } from "solid-js";

import { Field } from "./Field";

import styles from "./LatLngEditor.module.css";

export const LatLngEditor: Component<{
  id?: string,
  lat: number,
  lng: number,
  onChange: (newLat: number, newLng: number) => void,
}> = (props) => {
  const maxDigitsAfterDot = 6;

  const [latVal, setLatVal] = createSignal(props.lat ?? 0);
  const [lngVal, setLngVal] = createSignal(props.lng ?? 0);
  const [latTxt, setLatTxt] = createSignal(truncateDecimal(latVal().toString(), maxDigitsAfterDot));
  const [lngTxt, setLngTxt] = createSignal(truncateDecimal(lngVal().toString(), maxDigitsAfterDot));

  const handleLatChange: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    const trimmed = ev.currentTarget.value.trim();
    let newLat: number;
    if (trimmed === "") {
      setLatVal(newLat = 0);
      setLatTxt("0");
    } else {
      const group = /-?0*(\d*(\.\d*)?)/.exec(trimmed)?.[1];
      if (!group) return;

      let newLatTxt = truncateDecimal(trimmed.startsWith("-") ? "-" + group : group, maxDigitsAfterDot);

      setLatVal(newLat = Number.parseFloat(newLatTxt));
      setLatTxt(newLatTxt);
    }
    props.onChange(newLat, lngVal());
  }

  const handleLngChange: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    const trimmed = ev.currentTarget.value.trim();
    let newLng: number;
    if (trimmed === "") {
      setLngVal(newLng = 0);
      setLngTxt("0");
    } else {
      const group = /-?0*(\d*(\.\d*)?)/.exec(trimmed)?.[1];
      if (!group) return;

      let newLngTxt = truncateDecimal(trimmed.startsWith("-") ? "-" + group : group, maxDigitsAfterDot);

      setLngVal(newLng = Number.parseFloat(newLngTxt));
      setLngTxt(newLngTxt);
    }
    props.onChange(latVal(), newLng);
  }

  createEffect(() => {
    if (props.lat && latVal() !== props.lat) {
      setLatVal(props.lat);
      setLatTxt(truncateDecimal(latVal().toString(), maxDigitsAfterDot));
    }
    if (props.lng && lngVal() !== props.lng) {
      setLngVal(props.lng);
      setLngTxt(truncateDecimal(lngVal().toString(), maxDigitsAfterDot));
    }
  });
  
  return (
    <div class={styles.LatLngEditor} id={props.id}>
      <Field label="Latitude">
        {(id) => (
          <input id={id} type="text" value={latTxt()} onInput={handleLatChange} />
        )}
      </Field>
      <Field label="Longitude">
        {(id) => (
          <input id={id} type="text" value={lngTxt()} onInput={handleLngChange} />
        )}
      </Field>
    </div>
  )
}

function truncateDecimal(s: string, maxDigitsAfterDot: number): string {
  let parts = s.split(".");

  if (parts.length === 0) {
    return "";
  } else if (parts.length === 1) {
    return s;
  } else {
    return `${parts[0]}.${parts[1].substring(0, maxDigitsAfterDot)}`;
  }
}