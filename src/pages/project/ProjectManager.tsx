import { Component, createResource, createSignal, For, JSX, Show } from "solid-js";
import { FiTrash } from "solid-icons/fi";

import styles from "./ProjectManager.module.css";
import { Field } from "../../components/Field";
import { useParams } from "@solidjs/router";
import { useProject } from "../../hooks/Project";

export const ProjectManager: Component = () => {
  const params = useParams();
  const [project, setProject] = useProject();

  const handleProjectTitleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newTitle = event.currentTarget.value;
    setProject(project => ({
      ...project,
      title: newTitle,
    }));
  };

  const handleDeleteClick = async () => {
    if (!project()) return;
    if (prompt("Are you sure you want to delete this project? This cannot be undone.\nTo delete the project, type its full name below.") === project()!.title) {
      console.error("TODO")
    }
  };

  return (
    <div class={styles.ProjectManager}>
      <Field label="Project Title">
        {(id) => (
          <input type="text" id={id} value={project()?.title ?? ""} onInput={handleProjectTitleInput} />
        )}
      </Field>

      
      <Field set label="Actions">
        {() => (
          <>
            <span class="hint" style="margin-bottom: 12px">WARNING: Project deletion cannot be undone. All project data - tours, images, and audio files - will be permanently deleted. Perform this action with caution.</span>
            <button onClick={handleDeleteClick} class="danger">Delete Project</button>
          </>
        )}
      </Field>
    </div>
  );
}
