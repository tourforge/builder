import { useEffect, useRef, useState } from "react";

import Modal from "react-modal";
import "react-toastify/dist/ReactToastify.css";

import { LatLng, TourModel } from "src/data";

import Map from "./map";
import Sidebar from "./sidebar/sidebar";

import styles from "styles/tour-editor/TourEditor.module.css";
import { SetterOrUpdater } from "src/state";

export default function TourEditor({ tour, setTour }: { tour: TourModel, setTour: SetterOrUpdater<TourModel> }) {
  const mapCenter = useRef<LatLng>({ "lat": 0, "lng": 0 });

  useEffect(() => {
    Modal.setAppElement(document.getElementById("__next")!);
  }, []);

  return (
    <div className={styles.main}>
      <Sidebar mapCenter={mapCenter} tour={tour} setTour={setTour} />
      <Map centerRef={mapCenter} tour={tour} setTour={setTour} />
    </div>
  );
}
