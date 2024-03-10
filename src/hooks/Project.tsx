import { Component, JSX, createContext, createResource, useContext } from "solid-js";
import { ProjectModel } from "../data";
import { DbProject, useDB } from "../db";

export const useProject = () => {
  const context = useContext(ProjectContext);

  if (context !== undefined) {
    return context;
  } else {
    throw new Error("Attempted to useProject() outside of ProjectProvider");
  }
};

export const ProjectContext = createContext<[
  () => DbProject | undefined,
  (value: (Exclude<ProjectModel, Function> | ((value: DbProject) => ProjectModel))) => void
]>();

export const ProjectProvider: Component<{ id: string, children: JSX.Element }> = (props) => {
  const db = useDB();
  const [project, { mutate: mutateProject }] = createResource(() => db.loadProject(props.id));

  const get = () => project();
  const set = async (value: Exclude<ProjectModel, Function> | ((value: DbProject) => ProjectModel)) => {
    const oldDbProject = get();
    if (oldDbProject === undefined) {
      console.warn("ignoring function update undefined dbProject");
      return;
    }

    if (typeof value === "function") {
      value = value(oldDbProject);
    }

    const newDbProject = {
      ...oldDbProject,
      ...value,
    };

    mutateProject(newDbProject);
    await db.storeProject(newDbProject);
  };
  
  return (
    <ProjectContext.Provider value={[get, set]}>
      {props.children}
    </ProjectContext.Provider>
  );
};
