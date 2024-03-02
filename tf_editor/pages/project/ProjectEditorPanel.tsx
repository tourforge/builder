import { A, useParams } from "@solidjs/router";
import { Component, For, Show, createResource } from "solid-js";

import { useApiClient } from "../../api";

import styles from "./ProjectEditorPanel.module.css";
import { useProject } from "../../hooks/ProjectContext";
import { useToursList } from "../../hooks/TourListContext";

export const ProjectEditorPanel: Component = () => {
  const params = useParams();
  const api = useApiClient();
  const [project, _] = useProject();
  const [tours, refetchTours] = useToursList();
  const [role] = createResource(async () => await api.getRole(params.pid))

  const handleCreateTourClick = async () => {
    await api.createTour(params.pid, {
      title: "Untitled Tour",
      content: {
        version: "1",
        desc: "",
        route: [],
        gallery: [],
        path: "",
        pois: [],
        tiles: undefined,
        type: "driving"
      },
    });

    refetchTours();
  };

  return (
    <div class={styles.ProjectEditorPanel}>
      {project.loading && "Loading project..."}
      {project.error && `Error loading project: ${project.error}`}
      <span class={styles.ProjectName}>{project()?.name}</span>
      <Show when={project()?.name}>
        <span class="hint">You are currently viewing the <em>{project()?.name}</em> project.</span>
      </Show>

      
      {tours.error && `Error loading tours: ${tours.error}`}
      {tours() != null && <span class={styles.SidebarHeader}>Tours{tours.loading && " (Loading updates...)"}</span>}
      <Show when={tours() != null}>
        <span class="hint">Below is the list of tours in the project. Click to edit, and create new tours with the Create Tour button.</span>
      </Show>
      <For each={tours()}>
        {(tour) => (
          <A href={`/projects/${params.pid}/tours/${tour.id}`} class="secondary">{tour.title}</A>
        )}
      </For>
      <button class="primary" onClick={handleCreateTourClick}>Create Tour</button>

      <span class={styles.SidebarHeader}>Assets</span>
      <span class="hint">Images and audio files are stored as <em>assets</em>. In the Assets Editor, you can download, update, and delete existing assets.</span>
      <A href={`/projects/${params.pid}/assets`} class="primary">Assets Editor</A>

      <div style="flex:1"></div>

      <Show when={role()?.role === "admin"}>
        <div class={styles.BottomButtons}>
          <A class="secondary" href={`/projects/${params.pid}/manage`}>Manage Project</A>
        </div>
      </Show>
    </div>
  );
};