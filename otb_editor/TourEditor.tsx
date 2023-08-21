import { useParams } from "@solidjs/router";
import { type Component } from "solid-js";

import { MapContextProvider } from "./MapLibreMap";
import { TourProvider } from "./TourContext";
import { TourEditorMap } from "./TourEditorMap";
import { TourEditorSidebar } from "./TourEditorSidebar";

import styles from "./TourEditor.module.css";

export const TourEditor: Component = () => {
  const params = useParams();

  return (
    <div class={styles.TourEditor}>
      <TourProvider pid={params.pid} tid={params.tid}>
        <MapContextProvider>
          <TourEditorSidebar />
          <TourEditorMap />
        </MapContextProvider>
      </TourProvider>
    </div>
  );
};