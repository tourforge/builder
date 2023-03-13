import clsx from "clsx";
import useMapController from "hooks/mapController";
import useShowDialog, { DialogProvider } from "hooks/showDialog";
import { nanoid } from "nanoid";
import { ChangeEvent, useId, useState } from "react";
import { FaArrowDown, FaArrowUp, FaEdit, FaTrash } from "react-icons/fa";
import { ControlPointModel, PoiModel, TourModel, WaypointModel } from "src/data";
import { callIfUpdater, removeElementAtIndex, SetterOrUpdater } from "src/state";
import styles from "styles/TourPanel.module.css";
import AssetChooser from "./AssetChooser";
import ConfirmDialog from "./ConfirmDialog";
import GalleryEditor from "./GalleryEditor";
import { Panel } from "./TourEditor";

export default function TourPanel({ tour, setTour, displayPanel }: {
  tour: TourModel,
  setTour: SetterOrUpdater<TourModel>,
  displayPanel: (panel: Panel) => void,
}) {
  const id = useId();
  const [currentTab, setCurrentTab] = useState<"waypoints" | "pois">("waypoints");

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setTour(current => ({ ...current, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setTour(current => ({ ...current, desc: ev.target.value }));
  }

  function handleTilesChange(tiles: string) {
    setTour(current => ({ ...current, tiles }));
  }

  function handleSiteLinkChange(ev: ChangeEvent<HTMLInputElement>) {
    if (!ev.target.value) {
      setTour(current => ({ ...current, links: {} }));
    } else {
      setTour(current => ({ ...current, links: { "Site Link": { href: ev.target.value } } }));
    }
  }

  return (
    <div className={styles.TourPanel}>
      <div className="field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input
          type="text"
          name="Tour Title"
          id={`${id}-title`}
          value={tour.name}
          onChange={handleTitleChange}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-desc`}>Description</label>
        <textarea
          rows={3}
          name="Tour Description"
          id={`${id}-desc`}
          value={tour.desc}
          onChange={handleDescChange}
        ></textarea>
      </div>
      <div className="field">
        <label htmlFor={`${id}-tiles`}>Map Tiles</label>
        <AssetChooser id={`${id}-tiles`} kind="tiles" value={tour.tiles} onChange={handleTilesChange} />
      </div>
      <div className="field">
        <label htmlFor={`${id}-site-link`}>Site Link</label>
        <input
          name="Site Link"
          type="text"
          id={`${id}-site-link`}
          value={tour.links !== undefined ? tour.links["Site Link"]?.href ?? "" : ""}
          onChange={handleSiteLinkChange}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-gallery`}>Gallery</label>
        <GalleryEditor
          gallery={tour.gallery}
          setGallery={newGallery => setTour({
            ...tour,
            gallery: callIfUpdater(tour.gallery, newGallery)
          })}
        />
      </div>
      <header className={clsx(styles.waypointsHeader, currentTab === "pois" && styles.pois)}>
        <button onClick={() => setCurrentTab("waypoints")}>Waypoints</button>
        <button onClick={() => setCurrentTab("pois")}>POIs</button>
      </header>
      <DialogProvider>
        {currentTab === "waypoints"
          ? <WaypointList
            waypoints={tour.waypoints}
            setWaypoints={newWaypoints => setTour(current => ({
              ...current,
              waypoints: callIfUpdater(tour.waypoints, newWaypoints),
            }))}
            onEdit={id => displayPanel({ which: "waypoint", id: id })}
          />
          : <PoiList
            pois={tour.pois}
            setPois={newPois => setTour(current => ({
              ...current,
              pois: callIfUpdater(tour.pois, newPois),
            }))}
            onEdit={id => displayPanel({ which: "poi", id: id })}
          />}
      </DialogProvider>
    </div>
  );
}

function WaypointList({ waypoints, setWaypoints, onEdit }: {
  waypoints: (WaypointModel | ControlPointModel)[],
  setWaypoints: SetterOrUpdater<(WaypointModel | ControlPointModel)[]>,
  onEdit: (id: string) => void,
}) {
  const showDialog = useShowDialog<boolean>();
  const map = useMapController();

  async function addWaypoint() {
    const newWaypoint: WaypointModel = {
      type: "waypoint",
      id: nanoid(),
      name: "Untitled",
      desc: "",
      lat: map.current?.center.lat ?? 0,
      lng: map.current?.center.lng ?? 0,
      narration: null,
      trigger_radius: 30.0,
      transcript: null,
      gallery: [],
      control: "route",
    };

    setWaypoints(current => [...current, newWaypoint]);
  }

  async function addControlPoint() {
    const newWaypoint: ControlPointModel = {
      type: "control",
      id: nanoid(),
      lat: map.current?.center.lat ?? 0,
      lng: map.current?.center.lng ?? 0,
      control: "route",
    };

    setWaypoints(current => [...current, newWaypoint]);
  }

  function handleMove(id: string, dir: "up" | "down") {
    const index = waypoints.findIndex(w => w.id === id);
    if (index === -1) return;

    if (dir === "up") {
      if (index === 0) return;

      setWaypoints(current => [...current.slice(0, index - 1), current[index], current[index - 1], ...current.slice(index + 1)]);
    } else if (dir === "down") {
      if (index === waypoints.length - 1) return;

      setWaypoints(current => [...current.slice(0, index), current[index + 1], current[index], ...current.slice(index + 2)]);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await showDialog(({ closeDialog }) => (
      <ConfirmDialog
        closeDialog={closeDialog}
        title="Delete waypoint"
        text="Are you sure you want to delete this waypoint? This action cannot be undone."
        action="Delete"
      />
    ));

    if (!confirmed) return;

    setWaypoints(current => removeElementAtIndex(current, current.findIndex(w => w.id === id)));
  }

  return (
    <div className={styles.waypointsList}>
      {waypoints.map(waypoint => (
        <div key={waypoint.id} className={styles.waypointCard}>
          <div className={styles.waypointName}>
            {waypoint.type === "waypoint" ? waypoint.name : "Control Point"}
          </div>
          <button className={styles.waypointButton} onClick={() => handleMove(waypoint.id, "up")}>
            <FaArrowUp />
          </button>
          <button className={styles.waypointButton} onClick={() => handleMove(waypoint.id, "down")}>
            <FaArrowDown />
          </button>
          <button className={styles.waypointButton} onClick={() => onEdit(waypoint.id)}>
            <FaEdit />
          </button>
          <button className={styles.waypointButton} onClick={() => handleDelete(waypoint.id)}>
            <FaTrash />
          </button>
        </div>
      ))}
      <button className="primary" style={{ margin: "auto" }} onClick={addWaypoint}>
        Add Waypoint
      </button>
      <button className="primary" style={{ margin: "auto" }} onClick={addControlPoint}>
        Add Control Point
      </button>
    </div>
  );
}

function PoiList({ pois, setPois, onEdit }: {
  pois: PoiModel[],
  setPois: SetterOrUpdater<PoiModel[]>,
  onEdit: (id: string) => void,
}) {
  const showDialog = useShowDialog<boolean>();
  const map = useMapController();

  async function addPoi() {
    const newPoi: PoiModel = {
      id: nanoid(),
      name: "Untitled",
      desc: "",
      lat: map.current?.center.lat ?? 0,
      lng: map.current?.center.lng ?? 0,
      gallery: [],
    };

    setPois(current => [...current, newPoi]);
  }

  async function handleDelete(id: string) {
    const confirmed = await showDialog(({ closeDialog }) => (
      <ConfirmDialog
        closeDialog={closeDialog}
        title="Delete POI"
        text="Are you sure you want to delete this point of interest? This action cannot be undone."
        action="Delete"
      />
    ));

    if (!confirmed) return;

    setPois(current => removeElementAtIndex(current, current.findIndex(p => p.id === id)));
  }

  return (
    <div className={styles.waypointsList}>
      {pois.map(poi => (
        <div key={poi.id} className={styles.waypointCard}>
          <div className={styles.waypointName}>
            {poi.name}
          </div>
          <button className={styles.waypointButton} onClick={() => onEdit(poi.id)}>
            <FaEdit />
          </button>
          <button className={styles.waypointButton} onClick={() => handleDelete(poi.id)}>
            <FaTrash />
          </button>
        </div>
      ))}
      <button className="primary" style={{ margin: "auto" }} onClick={addPoi}>
        Add Point of Interest
      </button>
    </div>
  );
}
