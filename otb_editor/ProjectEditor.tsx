import { Outlet } from "@solidjs/router";
import { type Component } from "solid-js";

import { ProjectEditorSidebar } from "./ProjectEditorSidebar";

import styles from "./ProjectEditor.module.css";

export const ProjectEditor: Component = () => {
  return (
    <div class={styles.ProjectEditor}>
      <ProjectEditorSidebar />
      <Outlet />
    </div>
  );
};