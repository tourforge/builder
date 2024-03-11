import { createEffect, createSignal } from "solid-js";

import { LatLng } from "../data";
import * as polyline from "../polyline";
import { useTour } from "./Tour";
import { route } from "../route";

export function useRouteCalculator() {
  const [tour, setTour] = useTour();

  const [prevLatLongs, setPrevLatLongs] = createSignal<(LatLng & { control: "path" | "route" })[]>([]);

  createEffect(async () => {
    if (!tour()) return;

    const latLongs = tour()!.route
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

    if (sameLength() && sameContents()) return;

    setPrevLatLongs(latLongs);

    const routePoints = await route(latLongs);
    if (!routePoints) {
      return;
    }

    setTour(tour => ({
      ...tour,
      path: polyline.encode(routePoints),
    }));
  });
}