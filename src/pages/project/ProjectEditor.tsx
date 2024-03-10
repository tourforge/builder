import { useParams } from "@solidjs/router";
import { type Component, JSX } from "solid-js";

import { ProjectEditorPanel } from "./ProjectEditorPanel";

import styles from "./ProjectEditor.module.css";
import { ProjectProvider } from "../../hooks/Project";

export const ProjectEditor: Component<{children?: JSX.Element}> = (props) => {
  const params = useParams();

  return (
    <div class={styles.ProjectEditor}>
      <ProjectProvider id={params.pid}>
        <ProjectEditorPanel />
        {props.children}
      </ProjectProvider>
    </div>
  );
};