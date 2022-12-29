import { nanoid } from "nanoid";
import { ChangeEvent, useId } from "react";
import { useRecoilState } from "recoil";
import { WaypointModel } from "../src/data";
import { currentTourState } from "../src/state";
import { FaPlus } from "react-icons/fa";

import styles from "../styles/Sidebar.module.css";
import WaypointEditor from "./sidebar/waypoint-editor";

export default function Sidebar() {
  const id = useId();

  const [currentTour, setCurrentTour] = useRecoilState(currentTourState);

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setCurrentTour(current => ({ ...current, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLInputElement>) {
    setCurrentTour(current => ({ ...current, desc: ev.target.value }));
  }

  async function handleAddWaypointClick() {
    const newWaypoint: WaypointModel = {
      id: nanoid(),
      name: "Untitled",
      desc: "",
      lat: 0.0,
      lng: 0.0,
      narration: null,
      trigger_radius: 30.0,
      transcript: null,
      gallery: [],
    };

    setCurrentTour(current => ({ ...current, waypoints: [...current.waypoints, newWaypoint] }));
  }

  function setWaypoint(index: number, waypoint: WaypointModel) {
    setCurrentTour(current => ({
      ...current,
      waypoints: [
        ...current.waypoints.slice(0, index),
        waypoint,
        ...current.waypoints.slice(index + 1),
      ],
    }));
  }

  return (
    <div className={styles.Sidebar}>
      <div className="column">
        <label htmlFor={`${id}-title`} className="inline-label">Title</label>
        <input
          type="text"
          name="Tour Title"
          id={`${id}-title`}
          defaultValue={currentTour.name}
          onChange={handleTitleChange}
        />
      </div>
      <div className="column">
        <label htmlFor={`${id}-desc`} className="inline-label">Description</label>
        <input
          type="text"
          name="Tour Description"
          id={`${id}-desc`}
          defaultValue={currentTour.desc}
          onChange={handleDescChange}
        />
      </div>
      <header className={styles.waypointsHeader}>Waypoints</header>
      {currentTour.waypoints.map((waypoint, index) => (
        <WaypointEditor
          waypoint={waypoint}
          setWaypoint={newWaypoint => typeof newWaypoint === "function"
            ? setWaypoint(index, newWaypoint(waypoint))
            : setWaypoint(index, newWaypoint)}
          key={waypoint.id}
        />
      ))}
      <button className={`primary ${styles.addWaypoint}`} onClick={handleAddWaypointClick}>
        <FaPlus /> Add Waypoint
      </button>
    </div>
  );
}
