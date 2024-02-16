import { Component, JSX, Resource, createContext, createEffect, createResource, useContext } from "solid-js";

import { ApiToursList, useApiClient } from "../api";

export const ToursListContext = createContext<[Resource<ApiToursList>, () => void]>();

export const useToursList = () => {
  const result = useContext(ToursListContext);

  if (!result) {
    throw Error("Attempted to call useProject outside of the ProjectContext");
  } else {
    return result;
  }
};

export const ToursListProvider: Component<{ children: JSX.Element, pid: string }> = (props) => {
  const api = useApiClient();
  const [toursList, { refetch }] = createResource(() => [props.pid], async ([pid]) => await api.listTours(pid));

  createEffect<[string]>(([oldPid] = [""]) => {
    if (oldPid === "") {
      // do nothing: this is the first run
    } else if (oldPid !== props.pid) {
      refetch();
    }

    return [props.pid];
  });

  return (
    <ToursListContext.Provider value={[toursList, refetch]}>
      {props.children}
    </ToursListContext.Provider>
  );
}