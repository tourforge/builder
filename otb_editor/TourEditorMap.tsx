import type { Component } from "solid-js";

import styles from "./TourEditorMap.module.css";
import { MapLibreMap } from "./MapLibreMap";

export const TourEditorMap: Component = () => {
  return (
    <div><MapLibreMap /></div>
  );
};