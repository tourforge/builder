import { Outlet } from "@solidjs/router";
import { type Component } from "solid-js";

import { ProjectEditorPanel } from "./ProjectEditorPanel";

import styles from "./ProjectEditor.module.css";

export const ProjectEditor: Component = () => {
  return (
    <div class={styles.ProjectEditor}>
      <ProjectEditorPanel />
      <Outlet />
    </div>
  );
};