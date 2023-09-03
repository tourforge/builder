import { createEffect, createSignal } from "solid-js";

import { useTour } from "./TourContext";
import { LatLng } from "../data";
import { useApiClient } from "../api";
import * as polyline from "../polyline";

export function useRouteCalculator() {
  const api = useApiClient();
  const [tour, setTour] = useTour();

  const [prevLatLongs, setPrevLatLongs] = createSignal<(LatLng & { control: "path" | "route" })[]>([]);

  createEffect(() => {
    console.log("tour change");
    if (!tour()) return;

    const latLongs = tour()!.content.waypoints
      .filter(w => w.control !== "none")
      .map(w => ({
        lat: w.lat,
        lng: w.lng,
        control: w.control as ("path" | "route")
      }));

    const sameLength = () => latLongs.length === prevLatLongs().length;
    const sameContents = () => latLongs.every((ll, i) => {
      const pll = prevLatLongs()[i];
      return ll.lat === pll?.lat && ll.lng === pll?.lng && ll.control === pll?.control;
    });

    console.log(sameLength(), sameContents());
    if (sameLength() && sameContents()) return;

    setPrevLatLongs(latLongs);

    api.route(latLongs)
      .then(route => {
        console.log(route);
        return setTour(({
          ...tour()!,
          content: {
            ...tour()!.content,
            path: polyline.encode(route),
          },
        }));
      })
      .catch(err => {
        console.error(err);
      });
  });
}