import { Component, createResource, For, JSX } from "solid-js";

import styles from "./ProjectManager.module.css";
import { Field } from "../../components/Field";
import { useParams } from "@solidjs/router";
import { useApiClient } from "../../api";

export const ProjectManager: Component = () => {
  const params = useParams();
  const api = useApiClient();
  const [project, { mutate: mutateProject }] = createResource(() => params.pid, async pid => await api.getProject(pid));
  const [members, { mutate: mutateMembers }] = createResource(() => params.pid, async pid => await api.listMembers(pid));

  const handleProjectTitleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newTitle = event.currentTarget.value;
    const currentProject = project()!;
    mutateProject(() => ({ id: currentProject.id, name: newTitle, last_published: currentProject.last_published }));
    await api.updateProject(currentProject.id, { name: newTitle });
  };

  const handleDeleteClick = async () => {
    if (confirm("Are you sure you want to delete this project?")) {
      console.log("TODO");
    }
  };

  return (
    <div class={styles.ProjectManager}>
      <Field label="Project Title">
        {(id) => (
          <input type="text" id={id} value={project()?.name ?? ""} onInput={handleProjectTitleInput} />
        )}
      </Field>

      <Field set label="Project Members">
        {() => <>
          <span class="hint" style="margin-bottom: 6px">
            The members of a project are the users who are authorized to edit tours within the project.
            Here, members can be added, removed, and updated.
          </span>
          <span class="hint" style="margin-bottom: 12px">
            <em>Admin</em> project members are allowed to view this page and manage other members or delete the project.
          </span>
          <For each={members()}>
            {member => (
              <div class={styles.Member}>
                {member.username}
              </div>
            )}
          </For>
        </>}
      </Field>

      <div style="flex:1"></div>
      <span class="hint">WARNING: Project deletion cannot be undone. All project data - tours, images, and audio files - will be permanently deleted. Perform this action with caution.</span>
      <button onClick={handleDeleteClick} class="danger">Delete Project</button>
    </div>
  );
}