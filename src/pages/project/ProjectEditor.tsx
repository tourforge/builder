import { useParams } from "@solidjs/router";
import { type Component, JSX, onCleanup } from "solid-js";

import { ProjectEditorPanel } from "./ProjectEditorPanel";

import styles from "./ProjectEditor.module.css";
import { ProjectProvider } from "../../hooks/Project";
import { useDB } from "../../db";
import { exportProject } from "../../export";

export const ProjectEditor: Component<{children?: JSX.Element}> = (props) => {
  const params = useParams();
  const db = useDB();

  const listener = async (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      await exportProject(db, params.pid);
    }
  };

  document.addEventListener('keydown', listener);
  onCleanup(() => document.removeEventListener('keydown', listener));

  return (
    <div class={styles.ProjectEditor}>
      <ProjectProvider id={params.pid}>
        <ProjectEditorPanel />
        {props.children}
      </ProjectProvider>
    </div>
  );
};