import { A, useParams } from "@solidjs/router";
import { Component, For, createResource } from "solid-js";

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
        desc: "",
        waypoints: [],
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

  return (
    <div class={styles.ProjectEditorPanel}>
      <div>
        {project.loading && "Loading project..."}
        {project.error && `Error loading project: ${project.error}`}
        {project()?.name}
      </div>
      <div>
        {tours.loading && "Loading tours..."}
        {tours.error && `Error loading tours: ${tours.error}`}
        {tours() != null && <strong>Tours</strong>}
      </div>
      <For each={tours()}>
        {(tour) => (
          <A href={`/projects/${params.pid}/tours/${tour.id}`}>{tour.title}</A>
        )}
      </For>
      <button class="primary" onClick={handleCreateTourClick}>Create Tour</button>
      <div style="flex:1"></div>
      <button class="primary" onClick={handleExportProjectClick}>Export Project</button>
    </div>
  );
};