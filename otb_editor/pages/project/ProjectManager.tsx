import { Component, createResource, createSignal, For, JSX, Show } from "solid-js";
import { FiTrash } from "solid-icons/fi";

import styles from "./ProjectManager.module.css";
import { Field } from "../../components/Field";
import { useParams } from "@solidjs/router";
import { ApiMember, useApiClient } from "../../api";
import { useProject } from "../../hooks/ProjectContext";

export const ProjectManager: Component = () => {
  const params = useParams();
  const api = useApiClient();
  const [username, setUsername] = createSignal<string | null | undefined>(undefined);
  api.addLoginStatusListener(() => {
    setUsername(api.loggedInUsername());
  });
  const [project, setProject, refetchProject] = useProject();
  const [members, { mutate: mutateMembers }] = createResource(() => params.pid, async pid => await api.listMembers(pid));

  const handleProjectTitleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = async (event) => {
    const newTitle = event.currentTarget.value;
    const currentProject = project()!;
    setProject(({ id: currentProject.id, name: newTitle, last_published: currentProject.last_published }));
    await api.updateProject(currentProject.id, { name: newTitle });
  };

  const handleMemberAdminInput: (member: ApiMember) => JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (member) => async (event) => {

  };

  const handleAddMemberClicked = () => {
    //const newUserUsername = prompt("Type the username of the member you would like to add.");
    //api.createMember(project()?.id, { })
  };

  const handleDeleteClick = async () => {
    if (!project()) return;
    if (prompt("Are you sure you want to delete this project? This cannot be undone.\nTo delete the project, type its full name below.") === project()!.name) {
      api.deleteProject(project()!.id);
    }
  };

  const handlePublishProjectClick = async () => {
    if (!confirm("Are you sure you want to publish this project, immediately updating it for all users and making it available for free download by anyone on the internet?")) return;
    await api.publish(params.pid);
    await refetchProject();
  };

  const handleUnpublishProjectClick = async () => {
    if (!confirm("Are you sure you want to unpublish this project, immediately making it inaccessible to all users of the tour app?")) return;
    await api.unpublish(params.pid);
    await refetchProject();
  };

  const publishedTime = () => {
    if (!project() || !project()!.last_published) return;
    const date = new Date(project()!.last_published+"Z");
    return date.toLocaleTimeString(undefined, { timeZoneName: 'short' });
  };

  const publishedDate = () => {
    if (!project() || !project()!.last_published) return;
    const date = new Date(project()!.last_published+"Z");
    return date.toLocaleDateString();
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
            Only admin project members like yourself are allowed to view this page and manage other members or delete the project.
          </span>
          <div class={styles.Members}>
            <For each={members()}>
              {member => (
                <div class={styles.Member}>
                  <div class={styles.MemberName}>{member.username}</div>
                  <div style="flex:1"></div>
                  <Show when={member.username !== username()}>
                    <Field>
                      {(id) => (
                        <div class={styles.MemberAdmin}>
                          <input type="checkbox" id={id} onInput={handleMemberAdminInput(member)} checked={member.admin} />
                          <label for={id}>Admin</label>
                        </div>
                      )}
                    </Field>
                    <button class={styles.MemberButton} title="Remove as Member"><FiTrash /></button>
                  </Show>
                  <Show when={member.username === username()}>
                    <div style="flex:1"></div>
                    <div class={styles.MemberAdmin}>
                      <em>This is you.</em>
                    </div>
                  </Show>
                </div>
              )}
            </For>
            <button class="primary" style={{ margin: "auto" }} onClick={handleAddMemberClicked}>Add Member</button>
          </div>
        </>}
      </Field>
      <Field set label="Actions">
        {() => (
          <>
            <Show when={publishedDate()}>
              <span class="hint" style="margin-bottom: 12px">This button allows you to publish the latest version of the project to the internet. This project was last published on {publishedDate()} at {publishedTime()}.</span>
            </Show>
            <Show when={project() && !project()!.last_published}>
              <span class="hint" style="margin-bottom: 12px">This button allows you to publish the latest version of the project to the internet. This project is not published at this time, which means that users of the tour app cannot download it.</span>
            </Show>
            <button onClick={handlePublishProjectClick} class="primary" style="margin-bottom: 12px">Publish Project</button>
            <span class="hint" style="margin-bottom: 12px">Unpublishes the project, making it inaccessible to users (of the tour mobile app, not this software) until it is re-published.</span>
            <button onClick={handleUnpublishProjectClick} class="secondary" style="margin-bottom: 12px">Unpublish Project</button>
            <span class="hint" style="margin-bottom: 12px">WARNING: Project deletion cannot be undone. All project data - tours, images, and audio files - will be permanently deleted. Perform this action with caution.</span>
            <button onClick={handleDeleteClick} class="danger">Delete Project</button>
          </>
        )}
      </Field>
    </div>
  );
}
