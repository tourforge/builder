import { createResource, type Component, Show, For } from "solid-js";
import { A } from "@solidjs/router";

import { useApiClient, AuthError } from "../../api";

import styles from "./Home.module.css";

export const Home: Component = () => {
  const api = useApiClient();
  const [projects, { refetch: refetchProjects }] = createResource(async () => {
    if (api.loggedInUsername()) {
      try {
        return await api.listProjects({ forceAuth: false })
      } catch (e) {
        if (e instanceof AuthError) {
          return null;
        } else {
          throw e;
        }
      }
    } else {
      return null;
    }
  });
  api.addLoginStatusListener(refetchProjects);

  const handleCreateProjectClick = async () => {
    await api.createProject({ name: "Untitled Project" });

    refetchProjects();
  };

  return (
    <div class={styles.Home}>
      <div class={styles.Welcome}>
        <header>Welcome to TourForge!</header>
        {projects.loading && "Loading..."}
        {projects.error && `${projects.error}`}
        <Show when={!projects.loading && projects()}>
          <p>Click on a project below to begin, or start a new project with the <strong>Create Project</strong> button.</p>
          <div class={styles.Projects}>
            <For each={projects()}>
              {project => (
                <A href={`/projects/${project.id}`} class="secondary" classList={{[styles.ProjectLink]: true}}>{project.name}</A>
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