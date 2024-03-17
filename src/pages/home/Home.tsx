import { createResource, type Component, Show, For, onMount } from "solid-js";
import { A } from "@solidjs/router";
import { v4 as uuidv4 } from "uuid";
import { toast } from "solid-toast";
import { FiEdit, FiFile, FiFilePlus, FiGlobe, FiTrash } from "solid-icons/fi";

import { type DbProject, useDB } from "../../db";
import { ImportError, type ReplacementAction, importProjectBundle, importProjectUrl } from "../../import";

import styles from "./Home.module.css";

export const Home: Component = () => {
  const db = useDB();
  const [projects, { refetch: refetchProjects }] = createResource(async () => await db.listProjects());

  // Automatic download of projects
  onMount(async () => {
    const url = new URL(window.location.href);
    const toDownload = url.searchParams.get("tourforge-load-project");
    if (toDownload != null) {
      url.searchParams.delete("tourforge-load-project");
      window.history.replaceState({}, "", url);
      await doLoadFromUrl(toDownload);
    }
  });

  const handleCreateProjectClick = async () => {
    const id = uuidv4();
    await db.storeProject({
      id,
      originalId: id,
      source: { type: "new" },
      title: "Empty Project",
      tours: [],
      assets: {},
    });

    await refetchProjects();
  };

  const handleLoadProjectClick = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.addEventListener("input", async (ev) => {
      const currentTarget = ev.currentTarget;
      if (currentTarget == null || !(currentTarget instanceof HTMLInputElement)) {
        return;
      }

      const files = currentTarget.files;
      if (files == null || files.length < 1) {
        return;
      }

      const file = files[0];

      const chooseReplacement = async (options: DbProject[]): Promise<ReplacementAction> => {
        // TODO: make a dialog and present the choices
        if (options.length <= 0) {
          return "new";
        }
        return "new";
      };

      try {
        await toast.promise(importProjectBundle(db, file, chooseReplacement), {
          loading: "Loading the project...",
          success: "Successfully loaded the project.",
          error(e) {
            if (e instanceof ImportError) {
              return `An error occurred while loading the project: ${e.message}`;
            } else {
              return "An internal error occurred while loading the project.";
            }
          },
        });
      } catch (e) {
        console.error("Failed to import tour bundle:", e);
      }

      await refetchProjects();
    });
    fileInput.dispatchEvent(new MouseEvent("click"));
  };

  const doLoadFromUrl = async (url: string) => {
    let parsedURL: URL;
    try {
      parsedURL = new URL(url);
    } catch (e) {
      toast.error("The URL you entered is invalid. URLs look like this: https://example.org/example/test/");
      console.error("Invalid URL", e);
      return;
    }

    try {
      await toast.promise(importProjectUrl(db, parsedURL, async () => "new"), {
        loading: "Downloading the project from the internet...",
        success: "Successfully downloaded the project.",
        error(e) {
          if (e instanceof ImportError) {
            return `An error occurred while downloading the project: ${e.message}`;
          } else {
            return "An internal error occurred while downloading the project.";
          }
        },
      });
    } catch (e) {
      console.error("Failed to import tour bundle:", e);
    }

    await refetchProjects();
  };

  const handleLoadFromUrlClick = async () => {
    const url = prompt("Enter the URL to load a project from:");
    if (url == null || url.length === 0) {
      return;
    }

    await doLoadFromUrl(url);
  };

  const handleProjectDeleteClick = (id: string, title: string) => async () => {
    const promptResult = prompt(
      "Are you sure you want to delete this project? This cannot be undone.\n" +
      `To delete the project, type its full title, "${title}", below.`,
    );

    if (promptResult === title) {
      await db.deleteProject(id);
      await refetchProjects();
    } else if (promptResult != null) {
      toast.error("The project was not deleted because the title entered was incorrect.");
    }
  };

  return (
    <div class={styles.Home}>
      <div class={styles.Welcome}>
        <header>Welcome to TourForge!</header>
        <p>
          TourForge is an application for building tours that are compatible with TourForge Guide.
          It works entirely within your web browser and as a result is sometimes unable to persistently
          save your work. A status message is always visible in the top bar indicating whether or not
          your work will persist.
        </p>
        <p>
          To the right is the list of tours (if any) that are currently loaded into TourForge; click Edit <FiEdit /> to
          begin editing. Alternatively, start a new project with <strong>Create Project</strong>, or
          use <strong>Load Project</strong> to load a project zip archive that was previously saved from the
          project editor screen. <strong>Load Project From URL</strong> downloads the latest content
          of a project that is currently published at some URL on the internet.
        </p>
      </div>
      <div class={styles.Projects}>
        {projects.loading && "Loading projects..."}
        {projects.error != null && `Error occurred while loading projects: ${projects.error}`}
        <Show when={!projects.loading && projects()}>
          <For each={projects()}>
            {project => (
              <div class={styles.ProjectCard}>
                <div class={styles.ProjectName}>
                  {project.title}
                </div>
                <A href={`/projects/${project.id}`} class={styles.ProjectButton}>
                  <FiEdit />
                </A>
                <button class={styles.ProjectButton} onClick={handleProjectDeleteClick(project.id, project.title)}>
                  <FiTrash />
                </button>
              </div>
            )}
          </For>
          <div class={styles.ProjectsButtons}>
            <div class={styles.CreateLoadButtons}>
              <button class="primary" onClick={handleCreateProjectClick}><FiFilePlus /> Create Project</button>
              <button class="primary" onClick={handleLoadProjectClick}><FiFile /> Load Project</button>
            </div>
            <button class="primary" onClick={handleLoadFromUrlClick}><FiGlobe /> Load Project From URL</button>
          </div>
        </Show>
      </div>
    </div>
  );
};
