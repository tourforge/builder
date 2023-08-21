import { type Component } from "solid-js";

import { TourEditorMap } from "./TourEditorMap";
import { TourEditorSidebar } from "./TourEditorSidebar";

import styles from "./TourEditor.module.css";
import { TourProvider } from "./TourContext";
import { useParams } from "@solidjs/router";

export const TourEditor: Component = () => {
  const params = useParams();

  return (
    <div class={styles.TourEditor}>
      <TourProvider pid={params.pid} tid={params.tid}>
        <TourEditorSidebar />
        <TourEditorMap />
      </TourProvider>
    </div>
  );
};