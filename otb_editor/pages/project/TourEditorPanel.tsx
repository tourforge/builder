import { FiArrowDown, FiArrowLeft, FiArrowUp, FiEdit, FiTrash } from "solid-icons/fi";
import { For, JSX, Resource, Setter, Show, createSignal, type Component } from "solid-js";
import { v4 as uuidv4 } from "uuid";

import { useTour } from "../../hooks/TourContext";

import { ApiTour } from "../../api";
import { Field } from "../../components/Field";
import { Gallery } from "../../components/Gallery";
import { ControlPointModel, GalleryModel, WaypointModel } from "../../data";
import { useRouteCalculator } from "../../hooks/RouteCalculator";
import { useMapController } from "./MapLibreMap";
import { WaypointEditorPanel } from "./WaypointEditorPanel";

import styles from "./TourEditorPanel.module.css";

type Panel = {
  which: "main",
} | {
  which: "waypoint",
  id: string,
} | {
  which: "poi",
  id: string,
};

export const TourEditorPanel: Component<{ pid: string }> = (props) => {
  const [tour, setTour] = useTour();
  const [panel, setPanel] = createSignal<Panel>({ which: "main" });

  useRouteCalculator();

  const waypointPanelWaypoint = () => {
    let curPanel = panel();
    let found = tour()?.content.waypoints.find(w => curPanel.which === "waypoint" && w.type === "waypoint" && w.id === curPanel.id);
    if (found && found.type === "waypoint") {
      return found;
    } else {
      return undefined;
    }
  };

  const handleWaypointPanelWaypointChange = (newWaypoint: WaypointModel) => {
    let foundIdx = tour()?.content.waypoints.findIndex(w => w.type === "waypoint" && w.id === newWaypoint.id);
    if (foundIdx === undefined || foundIdx < 0) return;

    setTour({
      ...tour()!,
      content: {
        ...tour()!.content,
        waypoints: [...tour()!.content.waypoints.slice(0, foundIdx), newWaypoint, ...tour()!.content.waypoints.slice(foundIdx + 1)],
      }
    });
  };

  return (
    <>
      <MainPanel show={panel().which === "main"} setPanel={setPanel} tour={tour} onChange={setTour} />
      <SubPanel
        show={panel().which !== "main"}
        title={panel().which === "waypoint" ? "Edit Waypoint" : "Edit POI"}
        onClose={() => setPanel({ which: "main" })}
      >
        <WaypointEditorPanel pid={props.pid} waypoint={waypointPanelWaypoint} onChange={handleWaypointPanelWaypointChange} />
      </SubPanel>
    </>
  );
};

const MainPanel: Component<{ show: boolean, tour: Resource<ApiTour>, onChange: (newTour: ApiTour) => void, setPanel: Setter<Panel> }> = (props) => {
  const [currentTab, setCurrentTab] = createSignal<"waypoints" | "pois">("waypoints");

  const handleTourTitleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const currentTour = props.tour()!;
    props.onChange({
      ...currentTour,
      title: event.currentTarget.value,
    });
  };

  const handleTourDescInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    const currentTour = props.tour()!;
    props.onChange({
      ...currentTour,
      content: {
        ...currentTour.content,
        desc: event.currentTarget.value,
      },
    });
  };

  const handleTypeInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    if (!ev.currentTarget.checked) return;

    const type = ev.currentTarget.value;
    if (type === "driving" || type === "walking") {
      props.onChange(({
        ...props.tour()!,
        content: {
          ...props.tour()!.content,
          type: type,
        },
      }));
    } else {
      console.error("Unexpected value:", type);
    }
  }

  const handleTourSiteLinkInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const currentTour = props.tour()!;
    props.onChange({
      ...currentTour,
      content: {
        ...currentTour.content,
        links: { "Site Link": { href: event.currentTarget.value } },
      },
    });
  };

  const handleTourGalleryChange = (newGallery: GalleryModel) => {
    const currentTour = props.tour()!;
    props.onChange({
      ...currentTour,
      content: {
        ...currentTour.content,
        gallery: newGallery,
      },
    });
  };

  const handleWaypointsChange = (newWaypoints: (WaypointModel | ControlPointModel)[]) => {
    const currentTour = props.tour()!;
    props.onChange({
      ...currentTour,
      content: {
        ...currentTour.content,
        waypoints: newWaypoints,
      },
    });
  };

  return (
    <div class={styles.MainPanel} classList={{ [styles.Hidden]: !props.show }}>
      {props.tour.loading && "Loading tour..."}
      {props.tour.error != null && `Error loading tour: ${props.tour.error}`}
      <Show when={props.tour()}>
        <Field label="Tour Title">
          {(id) => (
            <input type="text" id={id} value={props.tour()!.title} onInput={handleTourTitleInput} />
          )}
        </Field>
        <Field label="Tour Description">
          {(id) => (
            <textarea id={id} value={props.tour()!.content.desc} onInput={handleTourDescInput}></textarea>
          )}
        </Field>
        <Field set label="Tour Type">
          {(id) => (<>
            <div>
              <input
                type="radio"
                name="control"
                id={`${id}-driving`}
                value="driving"
                checked={props.tour()!.content.type === "driving"} 
                onInput={handleTypeInput}
              />
              <label for={`${id}-driving`}>Driving</label>
            </div>
            <div>
              <input
                type="radio"
                name="control"
                id={`${id}-walking`}
                value="walking"
                checked={props.tour()!.content.type === "walking"} 
                onInput={handleTypeInput}
              />
              <label for={`${id}-walking`}>Walking</label>
            </div>
          </>)}
        </Field>
        <Field label="Site Link">
          {(id) => (
            <input type="text" id={id} value={props.tour()!.content.links?.["Site Link"].href ?? ""} onInput={handleTourSiteLinkInput} />
          )}
        </Field>
        <Field label="Gallery">
          {(id) => (
            <Gallery id={id} pid={props.tour()!.project} value={props.tour()!.content.gallery} onChange={handleTourGalleryChange} />
          )}
        </Field>
        <header classList={{ [styles.PointsHeader]: true, [styles.Pois]: currentTab() === "pois" }}>
          <button onClick={() => setCurrentTab("waypoints")}>Waypoints</button>
          <button onClick={() => setCurrentTab("pois")}>POIs</button>
        </header>
        <Show when={currentTab() === "waypoints"}>
            <WaypointsList
              waypoints={() => props.tour()!.content.waypoints}
              onChange={handleWaypointsChange}
              onEditClick={(id) => props.setPanel({ which: "waypoint", id: id })}
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
  onEditClick: (id: string) => void,
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
    props.onChange([...props.waypoints().slice(0, index), ...props.waypoints().slice(index + 2)]);
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
          <button class={styles.PointButton} onClick={() => props.onEditClick(waypoint.id)}>
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

const SubPanel: Component<{ show: boolean, title: JSX.Element, onClose: () => void, children: JSX.Element }> = (props) => {
  return (
    <div class={styles.SubPanel} classList={{ [styles.Hidden]: !props.show }}>
      <div class={styles.SubPanelBar}>
        <button class={styles.SubPanelClose} onClick={props.onClose}>
          <FiArrowLeft />
        </button>
        <div class={styles.SubPanelTitle}>{props.title}</div>
      </div>
      {props.children}
    </div>
  );
};
