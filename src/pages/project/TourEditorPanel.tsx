import { FiArrowDown, FiArrowLeft, FiArrowUp, FiEdit, FiTrash } from "solid-icons/fi";
import { For, type JSX, type Setter, Show, createSignal, type Component } from "solid-js";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "@solidjs/router";

import { Field } from "../../components/Field";
import { Gallery } from "../../components/Gallery";
import { type ControlPointModel, type GalleryModel, type StopModel } from "../../data";
import { useRouteCalculator } from "../../hooks/RouteCalculator";
import { useTour } from "../../hooks/Tour";
import { useProject } from "../../hooks/Project";
import { Asset } from "../../components/Asset";

import { ControlPointEditorPanel } from "./ControlPointEditorPanel";
import styles from "./TourEditorPanel.module.css";
import { StopEditorPanel } from "./StopEditorPanel";
import { useMapController } from "./MapLibreMap";

type Panel = {
  which: "main",
} | {
  which: "stop",
  id: string,
} | {
  which: "control",
  id: string,
};

export const TourEditorPanel: Component = () => {
  const [tour, setTour] = useTour();
  const [panel, setPanel] = createSignal<Panel>({ which: "main" });

  useRouteCalculator();

  const waypointPanelWaypoint = () => {
    const curPanel = panel();
    const found = tour()?.route.find(w => curPanel.which === "stop" && w.type === "stop" && w.id === curPanel.id);
    if (found != null && found.type === "stop") {
      return found;
    } else {
      return undefined;
    }
  };

  const handleWaypointPanelWaypointChange = (newWaypoint: StopModel) => {
    const foundIdx = tour()?.route.findIndex(w => w.type === "stop" && w.id === newWaypoint.id);
    if (foundIdx === undefined || foundIdx < 0) return;

    setTour({
      ...tour()!,
      route: [...tour()!.route.slice(0, foundIdx), newWaypoint, ...tour()!.route.slice(foundIdx + 1)],
    });
  };

  const controlPanelControlPoint = () => {
    const curPanel = panel();
    const found = tour()?.route.find(w => curPanel.which === "control" && w.type === "control" && w.id === curPanel.id);
    if (found != null && found.type === "control") {
      return found;
    } else {
      return undefined;
    }
  };

  const handleControlPanelControlChange = (newControlPoint: ControlPointModel) => {
    const foundIdx = tour()?.route.findIndex(w => w.type === "control" && w.id === newControlPoint.id);
    if (foundIdx === undefined || foundIdx < 0) return;

    setTour({
      ...tour()!,
      route: [...tour()!.route.slice(0, foundIdx), newControlPoint, ...tour()!.route.slice(foundIdx + 1)],
    });
  };

  return (
    <>
      <MainPanel show={panel().which === "main"} setPanel={setPanel} />
      <SubPanel
        show={panel().which === "stop"}
        title="Edit Stop"
        onClose={() => setPanel({ which: "main" })}
      >
        <StopEditorPanel waypoint={waypointPanelWaypoint} onChange={handleWaypointPanelWaypointChange} />
      </SubPanel>
      <SubPanel
        show={panel().which === "control"}
        title="Edit Control Point"
        onClose={() => setPanel({ which: "main" })}
      >
        <ControlPointEditorPanel controlPoint={controlPanelControlPoint} onChange={handleControlPanelControlChange} />
      </SubPanel>
    </>
  );
};

export default TourEditorPanel;

const MainPanel: Component<{ show: boolean, setPanel: Setter<Panel> }> = (props) => {
  const [project] = useProject();
  const [tour, setTour, deleteTour] = useTour();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = createSignal<"route" | "pois">("route");

  const handleTourTitleInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    setTour(tour => ({
      ...tour,
      title: event.currentTarget.value,
    }));
  };

  const handleTourDescInput: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (event) => {
    setTour(tour => ({
      ...tour,
      desc: event.currentTarget.value,
    }));
  };

  const handleTilesIdChange = (id: string) => {
    setTour(tour => ({
      ...tour,
      tiles: id,
    }));
  };

  const handleTypeInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    if (!ev.currentTarget.checked) return;

    const type = ev.currentTarget.value;
    if (type === "driving" || type === "walking") {
      setTour(({
        ...tour()!,
        type,
      }));
    } else {
      console.error("Unexpected value:", type);
    }
  };

  const handleTourSiteLinkInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (event) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      links: { "Site Link": { href: event.currentTarget.value } },
    });
  };

  const handleTourGalleryChange = (newGallery: GalleryModel) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      gallery: newGallery,
    });
  };

  const handleRouteChange = (newRoute: Array<StopModel | ControlPointModel>) => {
    const currentTour = tour()!;
    setTour({
      ...currentTour,
      route: newRoute,
    });
  };

  const handleDeleteClick = async () => {
    const currentProject = project();
    if (currentProject != null && confirm("Are you sure you want to delete the tour? This action canot be undone.")) {
      deleteTour();
      navigate(`/projects/${currentProject.id}`);
    }
  };

  return (
    <div class={styles.MainPanel} classList={{ [styles.Hidden]: !props.show }}>
      <Show when={tour()}>
        <Field label="Title">
          {(id) => (
            <input type="text" id={id} value={tour()!.title} onInput={handleTourTitleInput} />
          )}
        </Field>
        <Field label="Description">
          {(id) => (
            <textarea id={id} value={tour()!.desc} onInput={handleTourDescInput}></textarea>
          )}
        </Field>
        <span class="field-label">Tiles</span>
        <span class="hint" style="margin-bottom: 4px">
          Adding map tiles to your tour is optional. If you don't know what those are,
          ignore this field.
        </span>
        <Field>
          {(id) => (
            <Asset id={id} type="tiles" asset={tour()!.tiles} onIdChange={handleTilesIdChange} />
          )}
        </Field>
        <Field set label="Type">
          {(id) => (<>
            <div>
              <input
                type="radio"
                name="control"
                id={`${id}-driving`}
                value="driving"
                checked={tour()!.type === "driving"}
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
                checked={tour()!.type === "walking"}
                onInput={handleTypeInput}
              />
              <label for={`${id}-walking`}>Walking</label>
            </div>
          </>)}
        </Field>
        <Field label="Site Link">
          {(id) => (
            <input type="text" id={id} value={tour()!.links["Site Link"]?.href ?? ""} onInput={handleTourSiteLinkInput} />
          )}
        </Field>
        <Field label="Gallery">
          {(id) => (
            <Gallery id={id} value={tour()!.gallery} onChange={handleTourGalleryChange} />
          )}
        </Field>
        <header classList={{ [styles.PointsHeader]: true, [styles.Pois]: currentTab() === "pois" }}>
          <button onClick={() => setCurrentTab("route")}>Route</button>
          <button onClick={() => setCurrentTab("pois")}>POIs</button>
        </header>
        <Show when={currentTab() === "route"}>
            <RouteList
              route={() => tour()!.route}
              onChange={handleRouteChange}
              onEditClick={(id, type) => props.setPanel({ which: type, id })}
            />
        </Show>
        <Show when={currentTab() === "pois"}>
            Points of interest are not currently implemented.
        </Show>
        <div style="flex:1"></div>
        <button onClick={handleDeleteClick} class="danger" style="margin-top: 32px">Delete Tour</button>
      </Show>
    </div>
  );
};

const RouteList: Component<{
  route: () => Array<StopModel | ControlPointModel>,
  onChange: (newRoute: Array<StopModel | ControlPointModel>) => void,
  onEditClick: (id: string, type: "stop" | "control") => void,
}> = (props) => {
  const map = useMapController();

  const addStop = () => {
    const newWaypoint: StopModel = {
      type: "stop",
      id: uuidv4(),
      title: "Untitled",
      desc: "",
      lat: map()?.getCenter().lat ?? 0,
      lng: map()?.getCenter().lng ?? 0,
      narration: undefined,
      trigger_radius: 30.0,
      transcript: undefined,
      gallery: [],
      control: "route",
      links: {},
    };

    props.onChange([...props.route(), newWaypoint]);
  };

  const addControlPoint = () => {
    const newWaypoint: ControlPointModel = {
      type: "control",
      id: uuidv4(),
      lat: map()?.getCenter().lat ?? 0,
      lng: map()?.getCenter().lng ?? 0,
      control: "route",
    };

    props.onChange([...props.route(), newWaypoint]);
  };

  const handleMove = (id: string, dir: "up" | "down") => {
    const index = props.route().findIndex(w => w.id === id);
    if (index === -1) return;

    if (dir === "up") {
      if (index === 0) return;

      props.onChange([...props.route().slice(0, index - 1), props.route()[index], props.route()[index - 1], ...props.route().slice(index + 1)]);
    } else if (dir === "down") {
      if (index === props.route().length - 1) return;

      props.onChange([...props.route().slice(0, index), props.route()[index + 1], props.route()[index], ...props.route().slice(index + 2)]);
    }
  };

  const handleDelete = (id: string) => {
    const index = props.route().findIndex(w => w.id === id);
    const wp = props.route()[index];
    const name = wp.type === "control" ? "Control Point" : wp.title;
    if (!confirm(`Are you sure you want to delete the waypoint "${name}"? This action cannot be undone.`)) return;
    props.onChange([...props.route().slice(0, index), ...props.route().slice(index + 1)]);
  };

  return (
    <div class={styles.PointsList}>
      <For each={props.route()}>
        {(waypoint) => (
        <div class={styles.PointCard}>
          <div class={styles.PointName}>
            {waypoint.type === "stop" ? waypoint.title : "Control Point"}
          </div>
          <button class={styles.PointButton} onClick={() => { handleMove(waypoint.id, "up"); }}>
            <FiArrowUp />
          </button>
          <button class={styles.PointButton} onClick={() => { handleMove(waypoint.id, "down"); }}>
            <FiArrowDown />
          </button>
          <button class={styles.PointButton} onClick={() => { props.onEditClick(waypoint.id, waypoint.type); }}>
            <FiEdit />
          </button>
          <button class={styles.PointButton} onClick={() => { handleDelete(waypoint.id); }}>
            <FiTrash />
          </button>
        </div>
        )}
      </For>
      <div class={styles.AddButtons}>
        <button class="primary" onClick={addStop}>
          Add Stop
        </button>
        <button class="primary" onClick={addControlPoint}>
          Add Control Point
        </button>
      </div>
    </div>
  );
};

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
