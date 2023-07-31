import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { route } from "src/api";
import { LatLng, TourModel } from "src/data";
import { SetterOrUpdater } from "src/state";
import * as polyline from "src/polyline";

export default function useRouteCalculator(tour: TourModel, setTour: SetterOrUpdater<TourModel>) {
  const [prevLatLongs, setPrevLatLongs] = useState<(LatLng & { control: "path" | "route" })[]>([]);

  useEffect(() => {
    const latLongs = tour.waypoints
      .filter(w => w.control !== "none")
      .map(w => ({
        lat: w.lat,
        lng: w.lng,
        control: w.control as ("path" | "route")
      }));

    const sameLength = () => latLongs.length === prevLatLongs.length;
    const sameContents = () => latLongs.every((ll, i) => {
      const pll = prevLatLongs[i];
      return ll.lat === pll.lat && ll.lng === pll.lng && ll.control === pll.control;
    });

    if (sameLength() && sameContents()) return;

    setPrevLatLongs(latLongs);

    route(latLongs)
      .then(route => setTour(tour => ({ ...tour, path: polyline.encode(route) })))
      .catch(err => {
        console.error(err);
        toast.error(`Failed to calculate tour route: ${err}`);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour.waypoints]);
}
