import { Outlet, useParams } from "@solidjs/router";
import { type Component } from "solid-js";

import { ProjectEditorPanel } from "./ProjectEditorPanel";

import styles from "./ProjectEditor.module.css";
import { ProjectProvider } from "../../hooks/ProjectContext";
import { ToursListProvider } from "../../hooks/TourListContext";

export const ProjectEditor: Component = () => {
  const params = useParams();

  return (
    <div class={styles.ProjectEditor}>
      <ProjectProvider pid={params.pid}>
        <ToursListProvider pid={params.pid}>
          <ProjectEditorPanel />
          <Outlet />
        </ToursListProvider>
      </ProjectProvider>
    </div>
  );
};