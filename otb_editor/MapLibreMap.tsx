import { Accessor, Component, Setter, createContext, createSignal, createUniqueId, onMount, useContext, JSX } from "solid-js";

import * as maplibregl from "maplibre-gl";

import styles from "./MapLibreMap.module.css";

export const MapLibreMap: Component = () => {
  const mapId = createUniqueId();
  const [_, setMap] = useContext(MapContext)!;

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

const MapContext = createContext<[Accessor<maplibregl.Map | undefined>, Setter<maplibregl.Map | undefined>]>();

export const useMapController = () => {
  const result = useContext(MapContext);

  if (!result) {
    throw Error("Attempted to call useMapController outside of the MapContext");
  } else {
    return result[0];
  }
};

export const MapContextProvider: Component<{ children: JSX.Element }> = (props) => {
  const [map, setMap] = createSignal<maplibregl.Map>();

  return (
    <MapContext.Provider value={[map, setMap]}>
      {props.children}
    </MapContext.Provider>
  );
};