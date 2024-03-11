import { type Component } from "solid-js";
import { useParams } from "@solidjs/router";

import { TourProvider } from "../../hooks/Tour";

import { MapContextProvider } from "./MapLibreMap";
import { TourEditorMap } from "./TourEditorMap";
import { TourEditorPanel } from "./TourEditorPanel";
import styles from "./TourEditor.module.css";

export const TourEditor: Component = () => {
  const params = useParams();

  return (
    <TourProvider id={params.tid}>
      <MapContextProvider>
        <div class={styles.TourEditor}>
          <TourEditorPanel />
          <TourEditorMap />
        </div>
      </MapContextProvider>
    </TourProvider>
  );
};
