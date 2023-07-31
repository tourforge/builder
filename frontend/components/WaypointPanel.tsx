import { ChangeEvent, useId } from "react";

import { WaypointModel } from "src/data";
import { callIfUpdater, SetterOrUpdater } from "src/state";

import AssetChooser from "./AssetChooser";
import GalleryEditor from "./GalleryEditor";
import LocationChooser from "./LocationChooser";

import styles from "styles/WaypointPanel.module.css";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { FaMapMarkerAlt, FaRoute, FaTimes } from "react-icons/fa";

export default function WaypointPanel({ waypoint, setWaypoint }: {
  waypoint: WaypointModel,
  setWaypoint: SetterOrUpdater<WaypointModel>,
}) {
  const id = useId();

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setWaypoint(waypoint => ({ ...waypoint, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setWaypoint(waypoint => ({ ...waypoint, desc: ev.target.value }));
  }

  function handleTriggerRadChange(ev: ChangeEvent<HTMLInputElement>) {
    if (+ev.target.value) {
      setWaypoint(waypoint => ({ ...waypoint, trigger_radius: +ev.target.value }));
    }
  }

  function handleLocationChange(lat: number, lng: number) {
    setWaypoint(waypoint => ({ ...waypoint, lat, lng }));
  }

  function handleTranscriptChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setWaypoint(waypoint => ({ ...waypoint, transcript: ev.target.value }));
  }

  function handleNarrationChange(narration: string) {
    setWaypoint(waypoint => ({ ...waypoint, narration: narration.trim() === "" ? null : narration.trim() }));
  }

  function handleSiteLinkChange(ev: ChangeEvent<HTMLInputElement>) {
    if (!ev.target.value) {
      setWaypoint(waypoint => ({ ...waypoint, links: {} }));
    } else {
      setWaypoint(waypoint => ({ ...waypoint, links: { "Site Link": { href: ev.target.value } } }));
    }
  }

  function handleControlTypeChange(type: "path" | "route" | "none") {
    setWaypoint(waypoint => ({ ...waypoint, control: type }));
  }

  return (
    <div className={styles.Waypoint}>
      <div className="field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input
          type="text"
          name="Waypoint Title"
          placeholder="Waypoint Title"
          defaultValue={waypoint.name}
          className={styles.waypointTitle}
          id={`${id}-title`}
          onChange={handleTitleChange}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-desc`}>Description</label>
        <textarea
          rows={8}
          name="Waypoint Description"
          id={`${id}-desc`}
          value={waypoint.desc}
          onChange={handleDescChange}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-trigger-rad`}>Trigger Radius</label>
        <input
          name="Trigger Radius"
          type="text"
          id={`${id}-trigger-rad`}
          defaultValue={waypoint.trigger_radius}
          onChange={handleTriggerRadChange}
        />
      </div>
      <LocationChooser lat={waypoint.lat} lng={waypoint.lng} onChange={handleLocationChange} />
      <div className="field">
        <label htmlFor={`${id}-gallery`}>Gallery</label>
        <GalleryEditor
          gallery={waypoint.gallery}
          setGallery={newGallery => setWaypoint(waypoint => ({
            ...waypoint,
            gallery: callIfUpdater(waypoint.gallery, newGallery)
          }))}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-narration`}>Narration</label>
        <AssetChooser id={`${id}-narration`} kind="narration" value={waypoint.narration ?? undefined} onChange={handleNarrationChange} />
      </div>
      <div className="field"> 
        <label htmlFor={`${id}-transcript`}>Transcript</label>
        <textarea
          rows={8}
          name="Narration Transcript"
          id={`${id}-transcript`}
          value={waypoint.transcript ?? ""}
          onChange={handleTranscriptChange}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-site-link`}>Site Link</label>
        <input
          name="Site Link"
          type="text"
          id={`${id}-site-link`}
          value={waypoint.links !== undefined ? waypoint.links["Site Link"]?.href ?? "" : ""}
          onChange={handleSiteLinkChange}
        />
      </div>
      <div className="field">
        <label>Control Type</label>
        <RadioGroup.Root
          orientation="horizontal"
          className={styles.controlTypeSelector}
          value={waypoint.control}
          onValueChange={handleControlTypeChange}
        >
          <RadioGroup.Item value="path">
            <FaRoute /> Path
          </RadioGroup.Item>
          <RadioGroup.Item value="route">
            <FaMapMarkerAlt /> Route
          </RadioGroup.Item>
          <RadioGroup.Item value="none">
            <FaTimes /> None
          </RadioGroup.Item>
        </RadioGroup.Root>
      </div>
    </div>
  );
}
