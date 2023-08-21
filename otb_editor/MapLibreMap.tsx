import { Component, createSignal, createUniqueId, onMount } from "solid-js";

import * as maplibregl from "maplibre-gl";

import styles from "./MapLibreMap.module.css";

export const MapLibreMap: Component = () => {
  const mapId = createUniqueId();
  const [map, setMap] = createSignal<maplibregl.Map>();

  onMount(() => {
    setMap(new maplibregl.Map({
      container: mapId,
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=LBk0jSklMmNKwGftcTqc", // stylesheet location
      center: [-79, 34], // starting position [lng, lat]
      zoom: 5, // starting zoom
    }))
  });

  return <div id={mapId} class={styles.MapLibreMapContainer}></div>;
};