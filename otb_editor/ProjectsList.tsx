import { A } from "@solidjs/router";
import { createResource, type Component } from "solid-js";

import { useApiClient } from "./api";

export const ProjectsList: Component = () => {
  const api = useApiClient();
  const [projects, { refetch: refetchProjects }] = createResource(async () => await api.listProjects());

  const handleCreateProjectClick = async () => {
    await api.createProject({ name: "Untitled Project" });

    refetchProjects();
  };

  return (
    <div>
      {projects.loading && "Loading..."}
      {projects.error && `${projects.error}`}
      {projects() != null && projects()!.map(prj => (
        <A href={`/projects/${prj.id}`}>{prj.name}</A>
      ))}
      <button onClick={handleCreateProjectClick}>Create Project</button>
    </div>
  );
};