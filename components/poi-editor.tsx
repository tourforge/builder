import { ChangeEvent, useId, useState } from "react";

import clsx from "clsx";
import { FaChevronUp, FaTrash } from "react-icons/fa";

import { PoiModel, } from "src/data";
import { callIfUpdater, SetterOrUpdater } from "src/state";

import GalleryEditor from "./gallery-editor";
import LocationChooser from "./location-chooser";

import styles from "styles/tour-editor/WaypointEditor.module.css";

export default function PoiEditor({ poi, setPoi, remove }: {
  poi: PoiModel,
  setPoi: SetterOrUpdater<PoiModel>,
  remove: () => void,
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);

  function handleExpandCollapseClick() {
    setExpanded(expanded => !expanded);
  }

  function handleTitleChange(ev: ChangeEvent<HTMLInputElement>) {
    setPoi(poi => ({ ...poi, name: ev.target.value }));
  }

  function handleDescChange(ev: ChangeEvent<HTMLTextAreaElement>) {
    setPoi(poi => ({ ...poi, desc: ev.target.value }));
  }

  function handleLocationChange(lat: number, lng: number) {
    setPoi(poi => ({ ...poi, lat, lng }));
  }

  function handleSiteLinkChange(ev: ChangeEvent<HTMLInputElement>) {
    if (!ev.target.value) {
      setPoi(poi => ({ ...poi, links: {} }));
    } else {
      setPoi(poi => ({ ...poi, links: { "Site Link": { href: ev.target.value } } }));
    }
  }

  return (
    <div className={`${styles.Waypoint} ${expanded ? styles.expanded : ""}`}>
      <div className={styles.waypointCardHeader}>
        <input
          type="text"
          name="POI Title"
          placeholder="POI Title"
          defaultValue={poi.name}
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
            name="POI Description"
            id={`${id}-desc`}
            value={poi.desc}
            onChange={handleDescChange}
          />
        </div>
        <LocationChooser lat={poi.lat} lng={poi.lng} onChange={handleLocationChange} />
        <GalleryEditor
          gallery={poi.gallery}
          setGallery={newGallery => setPoi(waypoint => ({
            ...waypoint,
            gallery: callIfUpdater(waypoint.gallery, newGallery)
          }))}
        />
        <div className="column">
          <label htmlFor={`${id}-site-link`} className="inline-label">Site Link</label>
          <input
            name="Site Link"
            type="text"
            id={`${id}-site-link`}
            value={poi.links !== undefined ? poi.links["Site Link"]?.href ?? "" : ""}
            onChange={handleSiteLinkChange}
          />
        </div>
      </section>
    </div>
  );
}
