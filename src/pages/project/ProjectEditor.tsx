import { useParams } from "@solidjs/router";
import { type Component, type JSX, onCleanup } from "solid-js";
import { toast } from "solid-toast";

import { ProjectProvider } from "../../hooks/Project";
import { useDB } from "../../db";
import { exportProjectBundle, ExportError } from "../../export";

import styles from "./ProjectEditor.module.css";
import { ProjectEditorPanel } from "./ProjectEditorPanel";

export const ProjectEditor: Component<{ children?: JSX.Element }> = (props) => {
  const params = useParams();
  const db = useDB();

  const listener = async (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      try {
        await exportProjectBundle(db, params.pid);
      } catch (err) {
        console.error("Error while exporting project:", err);
        if (err instanceof ExportError) {
          toast.error("An error occurred while saving the project: " + err.message);
        } else {
          toast.error("An internal error occurred while saving the project.");
        }
      }
    }
  };

  document.addEventListener("keydown", listener);
  onCleanup(() => { document.removeEventListener("keydown", listener); });

  return (
    <div class={styles.ProjectEditor}>
      <ProjectProvider id={params.pid}>
        <ProjectEditorPanel />
        {props.children}
      </ProjectProvider>
    </div>
  );
};
