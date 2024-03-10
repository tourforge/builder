import { createResource, type Component, Show, For } from "solid-js";
import { A } from "@solidjs/router";

import styles from "./Home.module.css";
import { useDB } from "../../db";
import { v4 as uuidv4 } from "uuid";

export const Home: Component = () => {
  const db = useDB();
  const [projects, { refetch: refetchProjects }] = createResource(async () => await db.listProjects());

  const handleCreateProjectClick = async () => {
    await db.storeProject({
      id: uuidv4(),
      source: { type: "new" },
      title: "Empty Project",
      tours: [],
      assets: {},
    });

    refetchProjects();
  };

  return (
    <div class={styles.Home}>
      <div class={styles.Welcome}>
        <header>Welcome to TourForge!</header>
        {projects.loading && "Loading projects..."}
        {projects.error && `Error occurred while loading projects: ${projects.error}`}
        <Show when={!projects.loading && projects()}>
          <p>Click on a project below to begin, or start a new project with the <strong>Create Project</strong> button.</p>
          <div class={styles.Projects}>
            <For each={projects()}>
              {project => (
                <A href={`/projects/${project.id}`} class="secondary" classList={{[styles.ProjectLink]: true}}>{project.title}</A>
              )}
            </For>
            <button class="primary" onClick={handleCreateProjectClick}>Create Project</button>
          </div>
        </Show>
        <Show when={!projects.loading && !projects()}>
          <p>You are currently not signed in. Use the <strong>Log In</strong> button at the top of your screen to view your available projects.</p>
        </Show>
      </div>
    </div>
  );
};