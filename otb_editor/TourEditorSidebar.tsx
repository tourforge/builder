import { JSX, Show, type Component } from "solid-js";

import { useTour } from "./TourContext";

import { Field } from "./Field";
import { Gallery } from "./Gallery";
import { GalleryModel } from "./data";

import styles from "./TourEditorSidebar.module.css";

export const TourEditorSidebar: Component = () => {
  const [tour, setTour] = useTour();

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
      </Show>
    </div>
  );
};