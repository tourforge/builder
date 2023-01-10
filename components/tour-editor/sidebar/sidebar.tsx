import { ChangeEvent, RefObject, useId } from "react";

import { nanoid } from "nanoid";
import { FaPlus } from "react-icons/fa";

import { LatLng, TourModel, WaypointModel } from "src/data";
import { callIfUpdater, removeElementAtIndex, replaceElementAtIndex, SetterOrUpdater } from "src/state";

import GalleryEditor from "../gallery-editor";

import styles from "styles/tour-editor/Sidebar.module.css";
import WaypointEditor from "./waypoint-editor";
import AssetChooser from "../asset-chooser";

export default function Sidebar({ mapCenter, tour, setTour }: {
  mapCenter: RefObject<LatLng>,
  tour: TourModel,
  setTour: SetterOrUpdater<TourModel>
}) {
  const id = useId();

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setTour(current => ({ ...current, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setTour(current => ({ ...current, desc: ev.target.value }));
  }

  function handleTilesChange(tiles: string) {
    setTour(current => ({ ...current, tiles }));
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

    setTour(current => ({ ...current, waypoints: [...current.waypoints, newWaypoint] }));
  }

  function setWaypoint(index: number, waypoint: WaypointModel) {
    setTour(current => ({
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
          value={tour.name}
          onChange={handleTitleChange}
        />
      </div>
      <div className="column">
        <label htmlFor={`${id}-desc`} className="inline-label">Description</label>
        <textarea
          rows={3}
          name="Tour Description"
          id={`${id}-desc`}
          value={tour.desc}
          onChange={handleDescChange}
        ></textarea>
      </div>
      <AssetChooser name="Map Tiles" kind="tiles" value={tour.tiles} onChange={handleTilesChange} />
      <GalleryEditor
        gallery={tour.gallery}
        setGallery={newGallery => setTour({
          ...tour,
          gallery: callIfUpdater(tour.gallery, newGallery)
        })}
      />
      <header className={styles.waypointsHeader}>Waypoints</header>
      {tour.waypoints.map((waypoint, index) => (
        <WaypointEditor
          waypoint={waypoint}
          setWaypoint={newWaypoint => setWaypoint(index, callIfUpdater(waypoint, newWaypoint))}
          remove={() => setTour(tour => ({
            ...tour,
            waypoints: removeElementAtIndex(tour.waypoints, index),
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
