import { ChangeEvent, useEffect, useId, useState } from "react";

import styles from "styles/LocationChooser.module.css";

export default function LocationChooser({ lat, lng, onChange }: {
  lat?: number | undefined,
  lng?: number | undefined,
  onChange: (lat: number, lng: number) => void
}) {
  const id = useId();
  const [latState, setLat] = useState(lat ?? 0);
  const [lngState, setLng] = useState(lng ?? 0);
  const [latTxt, setLatTxt] = useState(truncateDecimal(latState.toString(), 6));
  const [lngTxt, setLngTxt] = useState(truncateDecimal(lngState.toString(), 6));

  useEffect(() => {
    if (lat && latState !== lat) {
      setLat(lat);
      setLatTxt(truncateDecimal(lat.toString(), 6));
    }
    if (lng && latState !== lat) {
      setLng(lng);
      setLngTxt(truncateDecimal(lng.toString(), 6));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]),

  useEffect(() => {
    onChange(latState, lngState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latState, lngState]);

  function handleLatChange(ev: ChangeEvent<HTMLInputElement>) {
    const trimmed = ev.target.value.trim();
    if (trimmed === "") {
      setLat(0);
      setLatTxt("0");
    } else {
      const group = /-?0*(\d*(\.\d*)?)/.exec(trimmed)?.[1];
      if (!group) return;

      let newLatTxt = truncateDecimal(trimmed.startsWith("-") ? "-" + group : group, 6);

      setLat(Number.parseFloat(newLatTxt));
      setLatTxt(newLatTxt);
    }
  }

  function handleLngChange(ev: ChangeEvent<HTMLInputElement>) {
    const trimmed = ev.target.value.trim();
    if (trimmed === "") {
      setLng(0);
      setLngTxt("0");
    } else {
      const group = /-?0*(\d*(\.\d*)?)/.exec(trimmed)?.[1];
      if (!group) return;

      let newLngTxt = truncateDecimal(trimmed.startsWith("-") ? "-" + group : group, 6);

      setLng(Number.parseFloat(newLngTxt));
      setLngTxt(newLngTxt);
    }
  }

  return (
    <div className={styles.LocationChooser}>
      <div className="field">
        <label htmlFor={`${id}-lat`}>Latitude</label>
        <input type="text" name="Latitude" value={latTxt} id={`${id}-lat`} onChange={handleLatChange} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-lng`}>Longitude</label>
        <input type="text" name="Longitude" value={lngTxt} id={`${id}-lng`} onChange={handleLngChange} />
      </div>
    </div>
  );
}

function truncateDecimal(s: string, maxDigitsAfterDot: number): string {
  let parts = s.split(".");

  if (parts.length === 1) {
    return s;
  } else {
    return `${parts[0]}.${parts[1].substring(0, maxDigitsAfterDot)}`;
  }
}
