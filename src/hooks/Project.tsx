import { type Component, type JSX, createContext, createResource, createSignal, useContext } from "solid-js";

import { type ProjectModel } from "../data";
import { type DbProject, useDB } from "../db";

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
  // eslint-disable-next-line @typescript-eslint/ban-types
  (value: (Exclude<ProjectModel, Function> | ((value: DbProject) => ProjectModel))) => void,
  () => Promise<void>,
]>();

export const ProjectProvider: Component<{ id: string, children: JSX.Element }> = (props) => {
  const db = useDB();
  const [deleted, setDeleted] = createSignal(false);
  const [project, { mutate: mutateProject }] = createResource(async () => await db.loadProject(props.id));

  const get = () => {
    if (deleted()) return undefined;

    return project();
  };
  // eslint-disable-next-line @typescript-eslint/ban-types
  const set = async (value: Exclude<ProjectModel, Function> | ((value: DbProject) => ProjectModel)) => {
    if (deleted()) return;

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
  const del = async () => {
    if (deleted() || project() == null) {
      return;
    }

    setDeleted(true);
    await db.deleteProject(project()!.id);
  };

  return (
    <ProjectContext.Provider value={[get, set, del]}>
      {props.children}
    </ProjectContext.Provider>
  );
};
