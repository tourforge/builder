import * as RadioGroup from "@radix-ui/react-radio-group";
import { FaMapMarkerAlt, FaRoute } from "react-icons/fa";
import { ControlPointModel } from "src/data";
import { SetterOrUpdater } from "src/state";

import styles from "styles/WaypointPanel.module.css";
import LocationChooser from "./LocationChooser";

export function ControlPointPanel({ point, setPoint }: {
  point: ControlPointModel,
  setPoint: SetterOrUpdater<ControlPointModel>,
}) {
  function handleLocationChange(lat: number, lng: number) {
    setPoint(point => ({ ...point, lat, lng }));
  }

  function handleControlTypeChange(type: "path" | "route") {
    setPoint(point => ({ ...point, control: type }));
  }

  return (
    <div className={styles.Waypoint}>
      <LocationChooser lat={point.lat} lng={point.lng} onChange={handleLocationChange} />
      <div className="field">
        <label>Control Type</label>
        <RadioGroup.Root
          orientation="horizontal"
          className={styles.controlTypeSelector}
          value={point.control}
          onValueChange={handleControlTypeChange}
        >
          <RadioGroup.Item value="path">
            <FaRoute /> Path
          </RadioGroup.Item>
          <RadioGroup.Item value="route">
            <FaMapMarkerAlt /> Route
          </RadioGroup.Item>
        </RadioGroup.Root>
      </div>
    </div>
  );
}
