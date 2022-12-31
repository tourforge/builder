import { ChangeEvent, RefObject, useId } from "react";
import { useRecoilState } from "recoil";

import { nanoid } from "nanoid";
import { FaPlus } from "react-icons/fa";

import { LatLng, WaypointModel } from "../src/data";
import { callIfUpdater, currentTourState, removeElementAtIndex, replaceElementAtIndex } from "../src/state";

import GalleryEditor from "./gallery-editor";

import styles from "../styles/Sidebar.module.css";
import WaypointEditor from "./sidebar/waypoint-editor";

export default function Sidebar({ mapCenter }: { mapCenter: RefObject<LatLng> }) {
  const id = useId();

  const [currentTour, setCurrentTour] = useRecoilState(currentTourState);

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setCurrentTour(current => ({ ...current, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setCurrentTour(current => ({ ...current, desc: ev.target.value }));
  }

  async function handleAddWaypointClick() {
    const newWaypoint: WaypointModel = {
      id: nanoid(),
      name: "Untitled",
      desc: "",
      lat: mapCenter.current?.lat ?? 0,
      lng: mapCenter.current?.lng ?? 0,
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
      waypoints: replaceElementAtIndex(
        current.waypoints,
        index,
        waypoint,
      ),
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
        <textarea
          rows={3}
          name="Tour Description"
          id={`${id}-desc`}
          defaultValue={currentTour.desc}
          onChange={handleDescChange}
        ></textarea>
      </div>
      <GalleryEditor
        gallery={currentTour.gallery}
        setGallery={newGallery => setCurrentTour({
          ...currentTour,
          gallery: callIfUpdater(currentTour.gallery, newGallery)
        })}
      />
      <header className={styles.waypointsHeader}>Waypoints</header>
      {currentTour.waypoints.map((waypoint, index) => (
        <WaypointEditor
          waypoint={waypoint}
          setWaypoint={newWaypoint => setWaypoint(index, callIfUpdater(waypoint, newWaypoint))}
          remove={() => setCurrentTour(currentTour => ({
            ...currentTour,
            waypoints: removeElementAtIndex(currentTour.waypoints, index),
          }))}
          key={waypoint.id}
        />
      ))}
      <button className={`primary ${styles.addWaypoint}`} onClick={handleAddWaypointClick}>
        <FaPlus /> Add Waypoint
      </button>
    </div>
  );
}
