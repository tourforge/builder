import { A, useParams } from "@solidjs/router";
import { Component, For, Show, createResource } from "solid-js";

import { useApiClient } from "../../api";

import styles from "./ProjectEditorPanel.module.css";

export const ProjectEditorPanel: Component = () => {
  const params = useParams();
  const api = useApiClient();
  const [project] = createResource(async () => await api.getProject(params.pid));
  const [tours, { refetch: refetchTours }] = createResource(async () => await api.listTours(params.pid));

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

    await refetchTours();
  };

  const handleExportProjectClick = async () => {
    const blob = await api.export(params.pid);
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const handleManageProjectClick = async () => {

  };

  return (
    <div class={styles.ProjectEditorPanel}>
      {project.loading && "Loading project..."}
      {project.error && `Error loading project: ${project.error}`}
      <span class={styles.ProjectName}>{project()?.name}</span>
      <Show when={project()?.name}>
        <span class="hint">You are currently viewing the <em>{project()?.name}</em> project.</span>
      </Show>

      {tours.loading && "Loading tours..."}
      {tours.error && `Error loading tours: ${tours.error}`}
      {tours() != null && <span class={styles.SidebarHeader}>Tours</span>}
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
      <span class="hint">You can export the whole project to a .zip file to be uploaded to a webserver for the app to download.</span>

      <div class={styles.BottomButtons}>
        <button class="primary" onClick={handleExportProjectClick}>Export</button>
        <A class="secondary" href={`/projects/${params.pid}/manage`}>Manage</A>
      </div>      
    </div>
  );
};