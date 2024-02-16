import { Component, JSX, Resource, createContext, createEffect, createResource, useContext } from "solid-js";

import { ApiProject, useApiClient } from "../api";

export const ProjectContext = createContext<[Resource<ApiProject>, (newValue: ApiProject) => void, () => ApiProject | Promise<ApiProject | undefined> | null | undefined]>();

export const useProject = () => {
  const result = useContext(ProjectContext);

  if (!result) {
    throw Error("Attempted to call useProject outside of the ProjectContext");
  } else {
    return result;
  }
};

export const ProjectProvider: Component<{ children: JSX.Element, pid: string }> = (props) => {
  const api = useApiClient();
  const [project, { mutate: mutateProject, refetch: refetchProject }] = createResource(() => [props.pid], async ([pid]) => await api.getProject(pid));

  createEffect<[string]>(([oldPid] = [""]) => {
    if (oldPid === "") {
      // do nothing: this is the first run
    } else if (oldPid !== props.pid) {
      refetchProject();
    }

    return [props.pid];
  });

  const setProject = async (newValue: ApiProject) => {
    mutateProject(newValue);
    await api.updateProject(props.pid, newValue);
  }

  return (
    <ProjectContext.Provider value={[project, setProject, refetchProject]}>
      {props.children}
    </ProjectContext.Provider>
  );
}