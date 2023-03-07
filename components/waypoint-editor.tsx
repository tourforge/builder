import { ChangeEvent, useId, useState } from "react";

import clsx from "clsx";
import { FaChevronUp, FaTrash } from "react-icons/fa";

import { WaypointModel } from "src/data";
import { callIfUpdater, SetterOrUpdater } from "src/state";

import AssetChooser from "./asset-chooser";
import GalleryEditor from "./gallery-editor";
import LocationChooser from "./location-chooser";

import styles from "styles/tour-editor/WaypointEditor.module.css";

export default function WaypointEditor({ index, waypoint, setWaypoint, remove }: {
  index: number,
  waypoint: WaypointModel,
  setWaypoint: SetterOrUpdater<WaypointModel>,
  remove: () => void,
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);

  function handleExpandCollapseClick() {
    setExpanded(expanded => !expanded);
  }

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

  return (
    <div className={`${styles.Waypoint} ${expanded ? styles.expanded : ""}`}>
      <div className={styles.waypointCardHeader}>
        <span className={styles.waypointNumber}>{index + 1}</span>
        <input
          type="text"
          name="Waypoint Title"
          placeholder="Waypoint Title"
          defaultValue={waypoint.name}
          className={styles.waypointTitle}
          id={`${id}-title`}
          onChange={handleTitleChange}
        />
        <div style={{flex:1}}></div>
        <button className={styles.waypointButton} onClick={remove}>
          <FaTrash />
        </button>
        <button className={clsx([styles.waypointButton, styles.waypointExpandCollapseButton])} onClick={handleExpandCollapseClick}>
          <FaChevronUp />
        </button>
      </div>
      <section className={styles.waypointExtraContent}>
        <div className="column">
          <label htmlFor={`${id}-desc`} className="inline-label">Description</label>
          <textarea
            name="Waypoint Description"
            id={`${id}-desc`}
            value={waypoint.desc}
            onChange={handleDescChange}
          />
        </div>
        <div className="column">
          <label htmlFor={`${id}-trigger-rad`} className="inline-label">Trigger Radius</label>
          <input
            name="Trigger Radius"
            type="text"
            id={`${id}-trigger-rad`}
            defaultValue={waypoint.trigger_radius}
            onChange={handleTriggerRadChange}
          />
        </div>
        <LocationChooser lat={waypoint.lat} lng={waypoint.lng} onChange={handleLocationChange} />
        <GalleryEditor
          gallery={waypoint.gallery}
          setGallery={newGallery => setWaypoint(waypoint => ({
            ...waypoint,
            gallery: callIfUpdater(waypoint.gallery, newGallery)
          }))}
        />
        <AssetChooser name="Narration" kind="narration" value={waypoint.narration ?? undefined} onChange={handleNarrationChange} />
        <div className="column"> 
          <label htmlFor={`${id}-transcript`} className="inline-label">Transcript</label>
          <textarea
            name="Narration Transcript"
            id={`${id}-transcript`}
            value={waypoint.transcript ?? ""}
            onChange={handleTranscriptChange}
          />
        </div>
        <div className="column">
          <label htmlFor={`${id}-site-link`} className="inline-label">Site Link</label>
          <input
            name="Site Link"
            type="text"
            id={`${id}-site-link`}
            value={waypoint.links !== undefined ? waypoint.links["Site Link"]?.href ?? "" : ""}
            onChange={handleSiteLinkChange}
          />
        </div>
      </section>
    </div>
  );
}
