import { ChangeEvent, useId } from "react";

import { PoiModel, } from "src/data";
import { callIfUpdater, SetterOrUpdater } from "src/state";

import GalleryEditor from "./GalleryEditor";
import LocationChooser from "./LocationChooser";

import styles from "styles/WaypointPanel.module.css";

export default function PoiPanel({ poi, setPoi }: {
  poi: PoiModel,
  setPoi: SetterOrUpdater<PoiModel>,
}) {
  const id = useId();

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
    <div className={styles.Waypoint}>
      <div className="field">
        <label htmlFor={`${id}-title`}>Title</label>
        <input
          type="text"
          name="POI Title"
          placeholder="POI Title"
          defaultValue={poi.name}
          className={styles.waypointTitle}
          id={`${id}-title`}
          onChange={handleTitleChange}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-desc`}>Description</label>
        <textarea
          name="POI Description"
          id={`${id}-desc`}
          value={poi.desc}
          onChange={handleDescChange}
        />
      </div>
      <LocationChooser lat={poi.lat} lng={poi.lng} onChange={handleLocationChange} />
      <div className="field">
        <label htmlFor={`${id}-gallery`}>Gallery</label>
        <GalleryEditor
          gallery={poi.gallery}
          setGallery={newGallery => setPoi(waypoint => ({
            ...waypoint,
            gallery: callIfUpdater(waypoint.gallery, newGallery)
          }))}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-site-link`}>Site Link</label>
        <input
          name="Site Link"
          type="text"
          id={`${id}-site-link`}
          value={poi.links !== undefined ? poi.links["Site Link"]?.href ?? "" : ""}
          onChange={handleSiteLinkChange}
        />
      </div>
    </div>
  );
}
