import { ChangeEvent, RefObject, useId } from "react";

import { nanoid } from "nanoid";

import { ControlPointModel, LatLng, PoiModel, TourModel, WaypointModel } from "src/data";
import { callIfUpdater, insertElementAtIndex, removeElementAtIndex, replaceElementAtIndex, SetterOrUpdater } from "src/state";

import GalleryEditor from "../gallery-editor";

import styles from "styles/tour-editor/Sidebar.module.css";
import WaypointEditor from "./waypoint-editor";
import AssetChooser from "../asset-chooser";
import { ControlPointEditor } from "./control-point-editor";
import AddPointButton from "./add-point-button";
import { useState } from "react";
import clsx from "clsx";
import PoiEditor from "./poi-editor";

export default function Sidebar({ mapCenter, tour, setTour }: {
  mapCenter: RefObject<LatLng>,
  tour: TourModel,
  setTour: SetterOrUpdater<TourModel>
}) {
  const id = useId();
  const [editor, setEditor] = useState<"waypoints" | "pois">("waypoints");

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setTour(current => ({ ...current, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setTour(current => ({ ...current, desc: ev.target.value }));
  }

  function handleTilesChange(tiles: string) {
    setTour(current => ({ ...current, tiles }));
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
      <header className={clsx(styles.waypointsHeader, editor === "pois" && styles.pois)}>
        <button onClick={() => setEditor("waypoints")}>Waypoints</button>
        <button onClick={() => setEditor("pois")}>POIs</button>
      </header>
      {editor === "waypoints"
        ? <WaypointsEditor mapCenter={mapCenter} tour={tour} setTour={setTour} />
        : <PoisEditor mapCenter={mapCenter} tour={tour} setTour={setTour} />}
    </div>
  );
}

function PoisEditor({ tour, setTour, mapCenter }: { tour: TourModel, setTour: SetterOrUpdater<TourModel>, mapCenter: RefObject<LatLng> }) {
  async function addPoi() {
    const newPoi: PoiModel = {
      id: nanoid(),
      name: "Untitled",
      desc: "",
      lat: mapCenter.current?.lat ?? 0,
      lng: mapCenter.current?.lng ?? 0,
      gallery: [],
    };

    setTour(current => ({ ...current, pois: [...current.pois, newPoi] }));
  }

  function setPoi(index: number, poi: PoiModel) {
    setTour(current => ({
      ...current,
      pois: replaceElementAtIndex(
        current.pois,
        index,
        poi,
      ),
    }));
  }

  return (
    <div className={styles.waypointsList}>
      {tour.pois.map((poi, index) => {
        return (
          <PoiEditor
            poi={poi}
            setPoi={newPoi => setPoi(index, callIfUpdater(poi, newPoi))}
            remove={() => setTour(tour => ({
              ...tour,
              pois: removeElementAtIndex(tour.pois, index),
            }))}
            key={poi.id}
          />
        );
      })}
      <AddPointButton addPoi={addPoi} alwaysVisible />
    </div>
  );
}

function WaypointsEditor({ tour, setTour, mapCenter }: { tour: TourModel, setTour: SetterOrUpdater<TourModel>, mapCenter: RefObject<LatLng> }) {
  async function addWaypoint(index: number) {
    const newWaypoint: WaypointModel = {
      type: "waypoint",
      id: nanoid(),
      name: "Untitled",
      desc: "",
      lat: mapCenter.current?.lat ?? 0,
      lng: mapCenter.current?.lng ?? 0,
      narration: null,
      trigger_radius: 30.0,
      transcript: null,
      gallery: [],
      control: "route",
    };

    setTour(current => ({ ...current, waypoints: insertElementAtIndex(current.waypoints, index, newWaypoint) }));
  }

  async function addControlPoint(index: number) {
    const newWaypoint: ControlPointModel = {
      type: "control",
      id: nanoid(),
      lat: mapCenter.current?.lat ?? 0,
      lng: mapCenter.current?.lng ?? 0,
      control: "route",
    };

    setTour(current => ({ ...current, waypoints: insertElementAtIndex(current.waypoints, index, newWaypoint) }));
  }

  function setWaypoint(index: number, waypoint: WaypointModel | ControlPointModel) {
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
    <div className={styles.waypointsList}>
      {tour.waypoints.map((waypoint, index) => {
        const realIndex = tour.waypoints.filter(w => w.type === "waypoint").findIndex(w => w.id === waypoint.id);

        return (
          <>
            <AddPointButton addWaypoint={() => addWaypoint(index)} addControlPoint={index !== 0 ? () => addControlPoint(index) : undefined} />
            {waypoint.type === "waypoint"
              ? <WaypointEditor
                index={realIndex}
                waypoint={waypoint}
                setWaypoint={newWaypoint => setWaypoint(index, callIfUpdater(waypoint, newWaypoint))}
                remove={() => setTour(tour => ({
                  ...tour,
                  waypoints: removeElementAtIndex(tour.waypoints, index),
                }))}
                key={waypoint.id}
              />
              : <ControlPointEditor
                point={waypoint}
                setPoint={newPoint => setWaypoint(index, callIfUpdater(waypoint, newPoint))}
                remove={() => setTour(tour => ({
                  ...tour,
                  waypoints: removeElementAtIndex(tour.waypoints, index),
                }))}
                key={waypoint.id}
              />}
          </>
        );
      })}
      <AddPointButton addWaypoint={() => addWaypoint(tour.waypoints.length)} alwaysVisible />
    </div>
  );
}
