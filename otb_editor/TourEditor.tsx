import { useParams } from "@solidjs/router";
import { type Component } from "solid-js";

import { MapContextProvider } from "./MapLibreMap";
import { TourProvider } from "./TourContext";
import { TourEditorMap } from "./TourEditorMap";
import { TourEditorPanel } from "./TourEditorPanel";

import styles from "./TourEditor.module.css";

export const TourEditor: Component = () => {
  const params = useParams();

  return (
    <TourProvider pid={params.pid} tid={params.tid}>
      <MapContextProvider>
        <div class={styles.TourEditor}>
          <TourEditorPanel pid={params.pid} />
          <TourEditorMap />
        </div>
      </MapContextProvider>
    </TourProvider>
  );
};