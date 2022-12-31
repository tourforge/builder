import { ChangeEvent, useEffect, useId, useState } from "react";

import styles from "../styles/LocationChooser.module.css";

export default function LocationChooser({ lat, lng, onChange }: {
  lat?: number | undefined,
  lng?: number | undefined,
  onChange: (lat: number, lng: number) => void
}) {
  const id = useId();
  const [latState, setLat] = useState(lat ?? 0);
  const [lngState, setLng] = useState(lng ?? 0);
  const [latTxt, setLatTxt] = useState(`${latState}`);
  const [lngTxt, setLngTxt] = useState(`${lngState}`);

  useEffect(() => {
    if (lat && latState !== lat) {
      setLat(lat);
      setLatTxt(`${lat.toFixed(6)}`);
    }
    if (lng && latState !== lat) {
      setLng(lng);
      setLngTxt(`${lng.toFixed(6)}`);
    }
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

      const newLat = Number.parseFloat(trimmed);

      setLat(newLat);
      if (trimmed.startsWith("-"))
        setLatTxt(`-${group}`);
      else
        setLatTxt(group);
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

      const newLng = Number.parseFloat(trimmed);

      setLng(newLng);
      if (trimmed.startsWith("-"))
        setLngTxt(`-${group}`);
      else
        setLngTxt(group);
    }
  }

  return (
    <div className={styles.LocationChooser}>
      <div>
        <label htmlFor={`${id}-lat`} className="inline-label">Latitude</label>
        <input type="text" name="Latitude" value={latTxt} id={`${id}-lat`} onChange={handleLatChange} />
      </div>
      <div>
        <label htmlFor={`${id}-lng`} className="inline-label">Longitude</label>
        <input type="text" name="Longitude" value={lngTxt} id={`${id}-lng`} onChange={handleLngChange} />
      </div>
    </div>
  );
}
