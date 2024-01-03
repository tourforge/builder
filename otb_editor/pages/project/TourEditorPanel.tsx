import { FiArrowDown, FiArrowLeft, FiArrowUp, FiEdit, FiTrash } from "solid-icons/fi";
import { For, JSX, Resource, Setter, Show, createSignal, type Component } from "solid-js";
import { v4 as uuidv4 } from "uuid";

import { useTour } from "../../hooks/TourContext";

import { ApiTour, useApiClient } from "../../api";
import { Field } from "../../components/Field";
import { Gallery } from "../../components/Gallery";
import { ControlPointModel, GalleryModel, StopModel } from "../../data";
import { useRouteCalculator } from "../../hooks/RouteCalculator";
import { useMapController } from "./MapLibreMap";
import { StopEditorPanel } from "./StopEditorPanel";

import styles from "./TourEditorPanel.module.css";
import { useNavigate } from "@solidjs/router";
import { ControlPointEditorPanel } from "./ControlPointEditorPanel";

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
    let curPanel = panel();
    let found = tour()?.content.route.find(w => curPanel.which === "stop" && w.type === "stop" && w.id === curPanel.id);
    if (found && found.type === "stop") {
      return found;
    } else {
      return undefined;
    }
  };

  const handleWaypointPanelWaypointChange = (newWaypoint: StopModel) => {
    let foundIdx = tour()?.content.route.findIndex(w => w.type === "stop" && w.id === newWaypoint.id);
    if (foundIdx === undefined || foundIdx < 0) return;

    setTour({
      ...tour()!,
      content: {
        ...tour()!.content,
        route: [...tour()!.content.route.slice(0, foundIdx), newWaypoint, ...tour()!.content.route.slice(foundIdx + 1)],
      }
    });
  };

  const controlPanelControlPoint = () => {
    let curPanel = panel();
    let found = tour()?.content.route.find(w => curPanel.which === "control" && w.type === "control" && w.id === curPanel.id);
    if (found && found.type === "control") {
      return found;
    } else {
      return undefined;
    }
  };

  const handleControlPanelControlChange = (newControlPoint: ControlPointModel) => {
    let foundIdx = tour()?.content.route.findIndex(w => w.type === "control" && w.id === newControlPoint.id);
    if (foundIdx === undefined || foundIdx < 0) return;

    setTour({
      ...tour()!,
      content: {
        ...tour()!.content,
        route: [...tour()!.content.route.slice(0, foundIdx), newControlPoint, ...tour()!.content.route.slice(foundIdx + 1)],
      }
    });
  };

  return (
    <>
      <MainPanel show={panel().which === "main"} setPanel={setPanel} tour={tour} onChange={setTour} />
      <SubPanel
        show={panel().which === "stop"}
        title="Edit Stop"
        onClose={() => setPanel({ which: "main" })}
      >
        <StopEditorPanel pid={tour()!.project} waypoint={waypointPanelWaypoint} onChange={handleWaypointPanelWaypointChange} />
      </SubPanel>
      <SubPanel
        show={panel().which === "control"}
        title="Edit Control Point"
        onClose={() => setPanel({ which: "main" })}
      >
        <ControlPointEditorPanel pid={tour()!.project} controlPoint={controlPanelControlPoint} onChange={handleControlPanelControlChange} />
      </SubPanel>
    </>
  );
};

const MainPanel: Component<{ show: boolean, tour: Resource<ApiTour>, onChange: (newTour: ApiTour) => void, setPanel: Setter<Panel> }> = (props) => {
  const api = useApiClient();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = createSignal<"route" | "pois">("route");

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

  const handleRouteChange = (newRoute: (StopModel | ControlPointModel)[]) => {
    const currentTour = props.tour()!;
    props.onChange({
      ...currentTour,
      content: {
        ...currentTour.content,
        route: newRoute,
      },
    });
  };

  const handleDeleteClick = async () => {
    if (confirm("Are you sure you want to delete the tour? This action canot be undone.")) {
      const tour = props.tour()!;
      await api.deleteTour(tour.project, tour.id);
      navigate(`/projects/${tour.project}`)
    }
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
          <button onClick={() => setCurrentTab("route")}>Route</button>
          <button onClick={() => setCurrentTab("pois")}>POIs</button>
        </header>
        <Show when={currentTab() === "route"}>
            <RouteList
              route={() => props.tour()!.content.route}
              onChange={handleRouteChange}
              onEditClick={(id, type) => props.setPanel({ which: type, id: id })}
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
  route: () => (StopModel | ControlPointModel)[],
  onChange: (newRoute: (StopModel | ControlPointModel)[]) => void,
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
      narration: null,
      trigger_radius: 30.0,
      transcript: null,
      gallery: [],
      control: "route",
    };

    props.onChange([...props.route(), newWaypoint]);
  }

  const addControlPoint = () => {
    const newWaypoint: ControlPointModel = {
      type: "control",
      id: uuidv4(),
      lat: map()?.getCenter().lat ?? 0,
      lng: map()?.getCenter().lng ?? 0,
      control: "route",
    };

    props.onChange([...props.route(), newWaypoint]);
  }

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
  }

  const handleDelete = (id: string) => {
    const index = props.route().findIndex(w => w.id === id);
    props.onChange([...props.route().slice(0, index), ...props.route().slice(index + 1)]);
  }

  return (
    <div class={styles.PointsList}>
      <For each={props.route()}>
        {(waypoint) => (
        <div class={styles.PointCard}>
          <div class={styles.PointName}>
            {waypoint.type === "stop" ? waypoint.title : "Control Point"}
          </div>
          <button class={styles.PointButton} onClick={() => handleMove(waypoint.id, "up")}>
            <FiArrowUp />
          </button>
          <button class={styles.PointButton} onClick={() => handleMove(waypoint.id, "down")}>
            <FiArrowDown />
          </button>
          <button class={styles.PointButton} onClick={() => props.onEditClick(waypoint.id, waypoint.type)}>
            <FiEdit />
          </button>
          <button class={styles.PointButton} onClick={() => handleDelete(waypoint.id)}>
            <FiTrash />
          </button>
        </div>
        )}
      </For>
      <button class="primary" style={{ margin: "auto" }} onClick={addStop}>
        Add Stop
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
