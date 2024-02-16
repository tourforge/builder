import { Component, createContext, createResource, createSignal, JSX, onCleanup, useContext, type Resource, createEffect } from "solid-js";
import { ApiTour, useApiClient } from "../api";
import { ToursListContext } from "./TourListContext";

export const TourContext = createContext<[Resource<ApiTour>, (newValue: ApiTour) => void]>();

export const useTour = () => {
  const result = useContext(TourContext);

  if (!result) {
    throw Error("Attempted to call useTour outside of the TourContext");
  } else {
    return result;
  }
};

export const TourProvider: Component<{ children: JSX.Element, pid: string, tid: string }> = (props) => {
  const autosaveInterval = 500;

  const api = useApiClient();
  const toursListContext = useContext(ToursListContext);
  const [tour, { mutate: mutateTour, refetch: refetchTour }] = createResource(() => [props.pid, props.tid], async ([pid, tid]) => await api.getTour(pid, tid));
  const [timerId, setTimerId] = createSignal<number | undefined>();

  createEffect<[string, string]>(([oldPid, oldTid] = ["", ""]) => {
    if (oldPid === "" || oldTid === "") {
      // do nothing: this is the first run
    } else if (oldPid !== props.pid || oldTid !== props.tid) {
      if (timerId()) {
        updateTour(oldPid, oldTid);
      }

      refetchTour();
    }

    return [props.pid, props.tid];
  });

  const updateTour = async (pid = props.pid, tid = props.tid) => {
    if (!pid || !tid) return;

    clearTimeout(timerId());
    setTimerId(undefined);

    const curTour = tour();
    if (!curTour) {
      return;
    }

    console.log("Updating tour...");

    const _ = await api.updateTour(pid, tid, curTour);

    // tell the tours list to refetch
    if (toursListContext) {
      const [_, refetchToursList] = toursListContext;
      refetchToursList();
    }

    // TODO: merge the updated tour returned from updateTour with our local version,
    //       or at least detect if they are out of sync.
  };

  onCleanup(updateTour);

  const setTour = (newValue: ApiTour) => {
    mutateTour(newValue);

    const curTimerId = timerId();
    if (!curTimerId) {
      console.log("Received tour change, creating timer...");
      setTimerId(window.setTimeout(updateTour, autosaveInterval))
    } else {
      console.log("Received tour change, using existing timer.");
    }
  }

  return (
    <TourContext.Provider value={[tour, setTour]}>
      {props.children}
    </TourContext.Provider>
  );
}
