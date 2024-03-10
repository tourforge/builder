import { Component, JSX, children, createContext, createSignal, useContext } from "solid-js";
import { useProject } from "./Project";
import { TourModel } from "../data";

export const useTour = () => {
  const context = useContext(TourContext);

  if (context !== undefined) {
    return context;
  } else {
    throw new Error("Attempted to useTour() outside of TourProvider");
  }
}

export const TourContext = createContext<[
  () => TourModel | undefined,
  (value: (Exclude<TourModel, Function> | ((value: TourModel) => TourModel))) => void,
  () => void,
]>();

export const TourProvider: Component<{ id: string, children: JSX.Element }> = (props) => {
  const [project, setProject] = useProject();
  const [deleted, setDeleted] = createSignal(false);

  const get = () => {
    if (deleted()) return undefined;

    return project()?.tours.find(tour => tour.id === props.id)
  };
  const set = (value: (Exclude<TourModel, Function> | ((value: TourModel) => TourModel))) => {
    if (deleted()) return;

    const currentProject = project();
    const currentTourIndex = project()?.tours.findIndex(tour => tour.id === props.id);
    if (currentProject === undefined || currentTourIndex === undefined || currentTourIndex === -1) {
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
  };

  return (
    <TourContext.Provider value={[get, set, del]}>
      {props.children}
    </TourContext.Provider>
  )
}
