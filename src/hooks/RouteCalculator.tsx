import { createEffect, createSignal } from "solid-js";
import { toast } from "solid-toast";

import { type LatLng } from "../data";
import * as polyline from "../polyline";
import { RoutingError, route } from "../route";

import { useTour } from "./Tour";

export function useRouteCalculator() {
  const [tour, setTour] = useTour();

  const [prevLatLongs, setPrevLatLongs] = createSignal<Array<LatLng & { control: "path" | "route" }>>([]);

  createEffect(async () => {
    if (tour() == null) return;

    const latLongs = tour()!.route
      .filter(w => w.control !== "none")
      .map(w => ({
        lat: w.lat,
        lng: w.lng,
        control: w.control as ("path" | "route"),
      }));

    const sameLength = () => latLongs.length === prevLatLongs().length;
    const sameContents = () => latLongs.every((ll, i) => {
      const pll = prevLatLongs()[i];
      return ll.lat === pll?.lat && ll.lng === pll?.lng && ll.control === pll?.control;
    });

    if (sameLength() && sameContents()) return;

    setPrevLatLongs(latLongs);

    try {
      const routePoints = await route(latLongs);

      setTour(tour => ({
        ...tour,
        path: polyline.encode(routePoints),
      }));
    } catch (e) {
      console.error("Error while routing:", e);
      if (e instanceof RoutingError) {
        toast.error(e.message);
      } else {
        toast.error("An internal error was encountered while generating the path connecting the tour stops along roads.");
      }
    }
  });
}
