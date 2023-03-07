import { FaCrosshairs, FaMapMarker, FaMapMarkerAlt, FaMapPin, FaMarker, FaRoute, FaTrash } from "react-icons/fa";
import { ControlPointModel } from "src/data";
import { SetterOrUpdater } from "src/state";

import styles from "styles/tour-editor/WaypointEditor.module.css";
import LocationChooser from "./location-chooser";

export function ControlPointEditor({ point, setPoint, remove }: { point: ControlPointModel, setPoint: SetterOrUpdater<ControlPointModel>, remove: () => void }) {
  function handleLocationChange(lat: number, lng: number) {
    setPoint(point => ({ ...point, lat, lng }));
  }

  function toggleControlType() {
    setPoint(point => ({ ...point, control: point.control === "path" ? "route" : "path"}));
  }

  return (
    <div className={`${styles.Waypoint} ${styles.expanded}`}>
      <div className={styles.waypointCardHeader}>
        <button className={styles.waypointButton} onClick={toggleControlType}>
          {point.control === "path" ? <FaRoute title="Control Point" /> : <FaMapMarkerAlt title="Control Point" />}
        </button>
        <span>{point.control === "path" ? "Path" : "Route"} Control Point</span>
        <div style={{ flex: 1 }}></div>
        <button className={styles.waypointButton} onClick={remove}><FaTrash /></button>
      </div>
      <section className={styles.waypointExtraContent}>
        <LocationChooser lat={point.lat} lng={point.lng} onChange={handleLocationChange} />
      </section>
    </div>
  );
}
