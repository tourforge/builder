import { FiArrowDown, FiArrowUp, FiEdit, FiTrash } from "solid-icons/fi";
import { For, JSX, Show, createSignal, type Component } from "solid-js";
import { v4 as uuidv4 } from "uuid";

import { useTour } from "./TourContext";

import { Field } from "./Field";
import { Gallery } from "./Gallery";
import { useMapController } from "./MapLibreMap";
import { ControlPointModel, GalleryModel, WaypointModel } from "./data";

import styles from "./TourEditorSidebar.module.css";

export const TourEditorSidebar: Component = () => {
  const [tour, setTour] = useTour();
  const [currentTab, setCurrentTab] = createSignal<"waypoints" | "pois">("waypoints");

  const handleTourTitleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      title: event.currentTarget.value,
    });
  };

  const handleTourDescInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      content: {
        ...currentTour.content,
        desc: event.currentTarget.value,
      },
    });
  };

  const handleTourSiteLinkInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      content: {
        ...currentTour.content,
        links: { "Site Link": { href: event.currentTarget.value } },
      },
    });
  };

  const handleTourGalleryChange = (newGallery: GalleryModel) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      content: {
        ...currentTour.content,
        gallery: newGallery,
      },
    });
  };

  const handleWaypointsChange = (newWaypoints: (WaypointModel | ControlPointModel)[]) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      content: {
        ...currentTour.content,
        waypoints: newWaypoints,
      },
    });
  };

  return (
    <div class={styles.TourEditorSidebar}>
      {tour.loading && "Loading tour..."}
      {tour.error != null && `Error loading tour: ${tour.error}`}
      <Show when={tour()}>
        <Field label="Tour Title">
          {(id) => (
            <input type="text" id={id} value={tour()!.title} onInput={handleTourTitleInput} />
          )}
        </Field>
        <Field label="Tour Description">
          {(id) => (
            <textarea id={id} value={tour()!.content.desc} onInput={handleTourDescInput}></textarea>
          )}
        </Field>
        <Field label="Site Link">
          {(id) => (
            <input type="text" id={id} value={tour()!.content.links?.["Site Link"].href ?? ""} onInput={handleTourSiteLinkInput} />
          )}
        </Field>
        <Field label="Gallery">
          {(id) => (
            <Gallery id={id} pid={tour()!.project} value={tour()!.content.gallery} onChange={handleTourGalleryChange} />
          )}
        </Field>
        <header classList={{ [styles.PointsHeader]: true, [styles.Pois]: currentTab() === "pois" }}>
          <button onClick={() => setCurrentTab("waypoints")}>Waypoints</button>
          <button onClick={() => setCurrentTab("pois")}>POIs</button>
        </header>
        <Show when={currentTab() === "waypoints"}>
            <WaypointsList
              waypoints={() => tour()!.content.waypoints}
              onChange={handleWaypointsChange}
              onWaypointClick={() => {}}
            />
        </Show>
        <Show when={currentTab() === "pois"}>

        </Show>
      </Show>
    </div>
  );
};

const WaypointsList: Component<{
  waypoints: () => (WaypointModel | ControlPointModel)[],
  onChange: (newWaypoints: (WaypointModel | ControlPointModel)[]) => void,
  onWaypointClick: (id: string) => void,
}> = (props) => {
  const map = useMapController();

  const addWaypoint = () => {
    const newWaypoint: WaypointModel = {
      type: "waypoint",
      id: uuidv4(),
      title: "Untitled",
      desc: "",
      lat: map()?.getCenter().lat ?? 0,
      lng: map()?.getCenter().lng ?? 0,
      narration: null,
      trigger_radius: 30.0,
      transcript: null,
      gallery: [],
      control: "route",
    };

    props.onChange([...props.waypoints(), newWaypoint]);
  }

  const addControlPoint = () => {
    const newWaypoint: ControlPointModel = {
      type: "control",
      id: uuidv4(),
      lat: map()?.getCenter().lat ?? 0,
      lng: map()?.getCenter().lng ?? 0,
      control: "route",
    };

    props.onChange([...props.waypoints(), newWaypoint]);
  }

  const handleMove = (id: string, dir: "up" | "down") => {
    const index = props.waypoints().findIndex(w => w.id === id);
    if (index === -1) return;

    if (dir === "up") {
      if (index === 0) return;

      props.onChange([...props.waypoints().slice(0, index - 1), props.waypoints()[index], props.waypoints()[index - 1], ...props.waypoints().slice(index + 1)]);
    } else if (dir === "down") {
      if (index === props.waypoints().length - 1) return;

      props.onChange([...props.waypoints().slice(0, index), props.waypoints()[index + 1], props.waypoints()[index], ...props.waypoints().slice(index + 2)]);
    }
  }

  const handleDelete = (id: string) => {
    const index = props.waypoints().findIndex(w => w.id === id);
    props.onChange([...props.waypoints().slice(0, index), ...props.waypoints().slice(index + 1)]);
  }

  return (
    <div class={styles.PointsList}>
      <For each={props.waypoints()}>
        {(waypoint) => (
        <div class={styles.PointCard}>
          <div class={styles.PointName}>
            {waypoint.type === "waypoint" ? waypoint.title : "Control Point"}
          </div>
          <button class={styles.PointButton} onClick={() => handleMove(waypoint.id, "up")}>
            <FiArrowUp />
          </button>
          <button class={styles.PointButton} onClick={() => handleMove(waypoint.id, "down")}>
            <FiArrowDown />
          </button>
          <button class={styles.PointButton} onClick={() => props.onWaypointClick(waypoint.id)}>
            <FiEdit />
          </button>
          <button class={styles.PointButton} onClick={() => handleDelete(waypoint.id)}>
            <FiTrash />
          </button>
        </div>
        )}
      </For>
      <button class="primary" style={{ margin: "auto" }} onClick={addWaypoint}>
        Add Waypoint
      </button>
      <button class="primary" style={{ margin: "auto" }} onClick={addControlPoint}>
        Add Control Point
      </button>
    </div>
  );
}