import { Component, Show, JSX } from "solid-js";
import { WaypointModel } from "../../data";

import styles from "./WaypointEditorPanel.module.css";
import { Field } from "../../components/Field";
import { Gallery } from "../../components/Gallery";
import { Asset } from "../../components/Asset";
import { LatLngEditor } from "../../components/LatLngEditor";

export const WaypointEditorPanel: Component<{ pid: string, waypoint: () => WaypointModel | undefined, onChange: (newWaypoint: WaypointModel) => void }> = (props) => {
  const handleTitleChange: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    props.onChange(({ ...props.waypoint()!, title: ev.currentTarget.value }));
  }

  const handleDescChange: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (ev) => {
    props.onChange(({ ...props.waypoint()!, desc: ev.currentTarget.value }));
  }

  const handleTriggerRadChange: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    if (+ev.currentTarget.value) {
      props.onChange(({ ...props.waypoint()!, trigger_radius: +ev.currentTarget.value }));
    }
  }

  const handleLocationChange = (lat: number, lng: number) => {
    if (lat === props.waypoint()!.lat && lng === props.waypoint()!.lng) {
      return;
    }

    props.onChange(({ ...props.waypoint()!, lat, lng }));
  }

  const handleTranscriptChange: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent> = (ev) => {
    props.onChange(({ ...props.waypoint()!, transcript: ev.currentTarget.value }));
  }

  const handleNarrationChange = (narration: string) => {
    props.onChange(({ ...props.waypoint()!, narration: narration.trim() === "" ? null : narration.trim() }));
  }

  const handleSiteLinkChange: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    if (!ev.currentTarget.value) {
      props.onChange(({ ...props.waypoint()!, links: {} }));
    } else {
      props.onChange(({ ...props.waypoint()!, links: { "Site Link": { href: ev.currentTarget.value } } }));
    }
  }

  const handleControlTypeInput: JSX.EventHandlerUnion<HTMLInputElement, InputEvent> = (ev) => {
    if (!ev.currentTarget.checked) return;

    const control = ev.currentTarget.value;
    if (control === "path" || control === "route" || control === "none") {
      props.onChange(({ ...props.waypoint()!, control: control }));
    } else {
      console.error("Unexpected value:", control);
    }
  }

  return (
    <Show when={props.waypoint()}>
      <div class={styles.WaypointEditorPanel}>
        <Field label="Title">
          {(id) => (
            <input
              id={id}
              type="text"
              placeholder="Waypoint Title"
              value={props.waypoint()!.title}
              onInput={handleTitleChange}
            />
          )}
        </Field>
        <Field label="Description">
          {(id) => (
            <textarea
              id={id}
              placeholder="Waypoint Description"
              value={props.waypoint()!.desc}
              onInput={handleDescChange}
            ></textarea>
          )}
        </Field>
        <Field label="Trigger Radius">
          {(id) => (
            <input
              id={id}
              type="text"
              value={props.waypoint()!.trigger_radius}
              onInput={handleTriggerRadChange}
            />
          )}
        </Field>
        <Field>
          {(id) => (
            <LatLngEditor
              id={id}
              lat={props.waypoint()!.lat}
              lng={props.waypoint()!.lng}
              onChange={handleLocationChange}
            />
          )}
        </Field>
        <Field label="Gallery">
          {(id) => (
            <Gallery
              id={id}
              pid={props.pid}
              value={props.waypoint()!.gallery}
              onChange={newGallery => props.onChange({
                ...props.waypoint()!,
                gallery: newGallery,
              })}
            />
          )}
        </Field>
        <Field label="Narration">
          {(id) => (
            <Asset
              id={id}
              pid={props.pid}
              asset={props.waypoint()!.narration ?? undefined}
              onIdChange={handleNarrationChange}
            />
          )}
        </Field>
        <Field label="Transcript">
          {(id) => (
            <textarea
              rows={8}
              id={id}
              placeholder="Waypoint Transcript"
              value={props.waypoint()!.transcript ?? ""}
              onInput={handleTranscriptChange}
            ></textarea>
          )}
        </Field>
        <Field label="Site Link">
          {(id) => (
            <input
              id={id}
              type="text"
              value={props.waypoint()!.links?.["Site Link"]?.href ?? ""}
              onInput={handleSiteLinkChange}
            />
          )}
        </Field>
        <Field set label="Control Type">
          {(id) => (<>
            <div>
              <input
                type="radio"
                name="control"
                id={`${id}-path`}
                value="path"
                checked={props.waypoint()!.control === "path"} 
                onInput={handleControlTypeInput}
              />
              <label for={`${id}-path`}>Path</label>
            </div>
            <div>
              <input
                type="radio"
                name="control"
                id={`${id}-route`}
                value="route"
                checked={props.waypoint()!.control === "route"}
                onInput={handleControlTypeInput}
              />
              <label for={`${id}-route`}>Route</label>
            </div>
            <div>
              <input
                type="radio"
                name="control"
                id={`${id}-none`}
                value="none"
                checked={props.waypoint()!.control === "none"}
                onInput={handleControlTypeInput}
              />
              <label for={`${id}-none`}>None</label>
            </div>
          </>)}
        </Field>
      </div>
    </Show>
  );
};