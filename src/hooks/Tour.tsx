import { type Component, type JSX, createContext, createSignal, useContext } from "solid-js";

import { type TourModel } from "../data";

import { useProject } from "./Project";

export const useTour = () => {
  const context = useContext(TourContext);

  if (context !== undefined) {
    return context;
  } else {
    throw new Error("Attempted to useTour() outside of TourProvider");
  }
};

export const TourContext = createContext<[
  () => TourModel | undefined,
  // eslint-disable-next-line @typescript-eslint/ban-types
  (value: (Exclude<TourModel, Function> | ((value: TourModel) => TourModel))) => void,
  () => void,
]>();

export const TourProvider: Component<{ id: string, children: JSX.Element }> = (props) => {
  const [project, setProject] = useProject();
  const [deleted, setDeleted] = createSignal(false);

  const get = () => {
    if (deleted()) return undefined;

    return project()?.tours.find(tour => tour.id === props.id);
  };
  // eslint-disable-next-line @typescript-eslint/ban-types
  const set = (value: (Exclude<TourModel, Function> | ((value: TourModel) => TourModel))) => {
    if (deleted()) return;

    const currentProject = project();
    const currentTourIndex = currentProject?.tours.findIndex(tour => tour.id === props.id);
    if (currentProject === undefined || currentTourIndex === undefined || currentTourIndex < 0) {
      console.warn("Ignoring update with undefined currentTour");
      return;
    }

    let newValue: TourModel;
    if (typeof value === "function") {
      newValue = value(currentProject.tours[currentTourIndex]);
    } else {
      newValue = value;
    }

    setProject(project => ({
      ...project,
      tours: [
        ...project.tours.slice(0, currentTourIndex),
        newValue,
        ...project.tours.slice(currentTourIndex + 1),
      ],
    }));
  };
  const del = () => {
    setDeleted(true);
    const currentTourIndex = project()?.tours.findIndex(tour => tour.id === props.id);
    if (currentTourIndex !== undefined && currentTourIndex >= 0) {
      setProject(project => ({
        ...project,
        tours: [
          ...project.tours.slice(0, currentTourIndex),
          ...project.tours.slice(currentTourIndex + 1),
        ],
      }));
    }
  };

  return (
    <TourContext.Provider value={[get, set, del]}>
      {props.children}
    </TourContext.Provider>
  );
};
