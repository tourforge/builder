import { A, useParams } from "@solidjs/router";
import { type Component, For, Show } from "solid-js";
import { toast } from "solid-toast";
import { v4 as uuidv4 } from "uuid";

import { useProject } from "../../hooks/Project";
import { ExportError, exportProject } from "../../export-bundle";
import { useDB } from "../../db";

import styles from "./ProjectEditorPanel.module.css";

export const ProjectEditorPanel: Component = () => {
  const params = useParams();
  const db = useDB();
  const [project, setProject] = useProject();

  const handleCreateTourClick = async () => {
    setProject(project => ({
      ...project,
      tours: [
        ...project.tours,
        {
          type: "driving",
          id: uuidv4(),
          title: "Empty Tour",
          desc: "",
          gallery: [],
          route: [],
          pois: [],
          path: "",
          links: {},
        },
      ],
    }));
  };
  const handleSaveClick = async () => {
    if (project() == null) {
      return;
    }

    try {
      await exportProject(db, project()!.id);
    } catch (err) {
      console.error("Error while exporting project:", err);
      if (err instanceof ExportError) {
        toast.error("An error occurred while saving the project: " + err.message);
      } else {
        toast.error("An internal error occurred while saving the project.");
      }
    }
  };

  return (
    <Show when={project()}>
      <div class={styles.ProjectEditorPanel}>
        <span class={styles.ProjectName}>{project()?.title}</span>
        <Show when={project()?.title}>
          <span class="hint">You are currently viewing the <em>{project()?.title}</em> project.</span>
        </Show>

        <span class="hint">Below is the list of tours in the project. Click to edit, and create new tours with the Create Tour button.</span>
        <For each={project()?.tours}>
          {(tour) => (
            <A href={`/projects/${params.pid}/tours/${tour.id}`} class="secondary">{tour.title}</A>
          )}
        </For>
        <button class="primary" onClick={handleCreateTourClick}>Create Tour</button>

        <span class={styles.SidebarHeader}>Assets</span>
        <span class="hint">Images and audio files are stored as <em>assets</em>. In the Assets Editor, you can download, update, and delete existing assets.</span>
        <A href={`/projects/${params.pid}/assets`} class="primary">Assets Editor</A>

        <div style="flex:1"></div>

        <div class={styles.BottomButtons}>
          <button class="primary" onClick={handleSaveClick}>Save (Ctrl+S)</button>
          <A class="secondary" href={`/projects/${params.pid}/manage`}>Settings</A>
        </div>
      </div>
    </Show>
  );
};
