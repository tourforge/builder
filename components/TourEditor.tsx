import { useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { ControlPointModel, LatLng, PoiModel, TourModel, WaypointModel } from "src/data";
import { SetterOrUpdater, replaceElementAtIndex, setterOrUpdater } from "src/state";

import styles from "styles/TourEditor.module.css";
import { ControlPointPanel } from "./ControlPointPanel";
import Map from "./Map";
import PoiPanel from "./PoiPanel";
import TourPanel from "./TourPanel";
import WaypointPanel from "./WaypointPanel";

export type Panel = {
  which: "tour",
} | {
  which: "waypoint",
  id: string,
} | {
  which: "poi",
  id: string,
};

export default function TourEditor({ tour, setTour }: { tour: TourModel, setTour: SetterOrUpdater<TourModel> }) {
  const [panel, setPanel] = useState<Panel>({ which: "tour" });
  const mapCenter = useRef<LatLng | undefined>();

  let panelElement;
  if (panel.which === "waypoint") {
    const index = () => tour.waypoints.findIndex(w => w.id === panel.id);

    if (tour.waypoints[index()].type === "waypoint") {
      const getter = () => tour.waypoints[index()] as WaypointModel;
      const setter = (waypoint: WaypointModel) => setTour(tour => ({
        ...tour,
        waypoints: replaceElementAtIndex(tour.waypoints, index(), waypoint),
      }));

      panelElement = <WaypointPanel
        waypoint={getter()}
        setWaypoint={setterOrUpdater(getter, setter)}
      />;
    } else {
      const getter = () => tour.waypoints[index()] as ControlPointModel;
      const setter = (waypoint: ControlPointModel) => setTour(tour => ({
        ...tour,
        waypoints: replaceElementAtIndex(tour.waypoints, index(), waypoint),
      }));

      panelElement = <ControlPointPanel
        point={getter()}
        setPoint={setterOrUpdater(getter, setter)}
      />;
    }
  } else if (panel.which === "poi") {
    const index = () => tour.pois.findIndex(p => p.id === panel.id);

    const getter = () => tour.pois[index()];
    const setter = (poi: PoiModel) => setTour(tour => ({
      ...tour,
      pois: replaceElementAtIndex(tour.pois, index(), poi),
    }));

    panelElement = <PoiPanel
      poi={getter()}
      setPoi={setterOrUpdater(getter, setter)}
    />;
  }

  return (
    <div className={styles.TourEditor}>
      <div style={{ display: panel.which === "tour" ? undefined : "none" }}>
        <TourPanel
          tour={tour}
          setTour={setTour}
          displayPanel={setPanel}
        />
      </div>
      {panel.which !== "tour" ? (
        <Subpanel
          title={panel.which === "waypoint" ? "Editing Waypoint" : "Editing POI"}
          close={() => setPanel({ which: "tour" })}
        >
          {panelElement}
        </Subpanel>
      ) : null}
      <Map tour={tour} setTour={setTour} onCenterChanged={c => mapCenter.current = c} />
    </div>
  );
}

function Subpanel({ title, close, children }: { title: string, close: () => void, children: JSX.Element | undefined }) {
  return (
    <div className={styles.Subpanel}>
      <div className={styles.subpanelBar}>
        <button className={styles.closeButton} onClick={close}>
          <FaArrowLeft />
        </button>
        <div className={styles.subpanelTitle}>{title}</div>
      </div>
      {children}
    </div>
  );
}
