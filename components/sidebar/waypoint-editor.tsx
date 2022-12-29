import { ChangeEvent, useId, useState } from "react";
import { FaChevronUp } from "react-icons/fa";
import { SetterOrUpdater } from "recoil";
import { WaypointModel } from "../../src/data";

import styles from "../../styles/WaypointEditor.module.css";
import AssetChooser from "../asset-chooser";
import LocationChooser from "../location-chooser";

export default function WaypointEditor({ waypoint, setWaypoint }: {
  waypoint: WaypointModel,
  setWaypoint: SetterOrUpdater<WaypointModel>
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

  function handleLocationChange(lat: number, lng: number) {
    setWaypoint(waypoint => ({ ...waypoint, lat, lng }));
  }

  function handleTranscriptChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setWaypoint(waypoint => ({ ...waypoint, transcript: ev.target.value }));
  }

  return (
    <div className={`${styles.Waypoint} ${expanded ? styles.expanded : ""}`}>
      <div className={styles.waypointCardHeader}>
        <input
          type="text"
          name="Waypoint Title"
          placeholder="Waypoint Title"
          defaultValue={waypoint.name}
          className={styles.waypointTitle}
          id={`${id}-title`}
          onChange={handleTitleChange}
        />
        <button className={styles.waypointExpandCollapseButton} onClick={handleExpandCollapseClick}>
          <FaChevronUp />
        </button>
      </div>
      <section className={styles.waypointExtraContent}>
        <div className="column">
          <label htmlFor={`${id}-desc`} className="inline-label">Description</label>
          <textarea
            name="Waypoint Description"
            id={`${id}-desc`}
            onChange={handleDescChange}
          />
        </div>
        <LocationChooser lat={waypoint.lat} lng={waypoint.lng} onChange={handleLocationChange} />
        <AssetChooser name="Narration" kind="image" />
        <div className="column"> 
          <label htmlFor={`${id}-transcript`} className="inline-label">Transcript</label>
          <textarea
            name="Narration Transcript"
            id={`${id}-transcript`}
            onChange={handleTranscriptChange}
          />
        </div>
      </section>
    </div>
  );
}
