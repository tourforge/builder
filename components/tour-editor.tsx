import { useEffect, useRef, useState } from "react";

import Modal from "react-modal";
import "react-toastify/dist/ReactToastify.css";

import { LatLng, TourModel } from "src/data";

import Map from "./map";
import Sidebar from "./sidebar";

import styles from "styles/tour-editor/TourEditor.module.css";
import { setterOrUpdater, SetterOrUpdater } from "src/state";
import { route } from "src/api";
import * as polyline from "src/polyline";
import { toast } from "react-toastify";

export default function TourEditor({ tour, setTour }: { tour: TourModel, setTour: SetterOrUpdater<TourModel> }) {
  const mapCenter = useRef<LatLng>({ "lat": 0, "lng": 0 });

  useEffect(() => {
    Modal.setAppElement(document.getElementById("__next")!);
  }, []);

  function setTourAndUpdateRoute(newTour: TourModel) {
    setTour(newTour);

    // only update route if waypoints seem to have changed
    if (newTour.waypoints.length !== tour.waypoints.length || !newTour.waypoints.every((w, i) => w !== tour.waypoints[i])) {
      route(newTour.waypoints).then(path => setTour(tour => ({
        ...tour, path: polyline.encode(path)
      }))).catch(err => {
        console.error("Failed to calculate tour route", err);
        toast.error("Failed to calculate tour route");
      });
    }
  }

  return (
    <div className={styles.main}>
      <Sidebar mapCenter={mapCenter} tour={tour} setTour={setterOrUpdater(() => tour, setTourAndUpdateRoute)} />
      <Map centerRef={mapCenter} tour={tour} setTour={setterOrUpdater(() => tour, setTourAndUpdateRoute)} />
    </div>
  );
}
