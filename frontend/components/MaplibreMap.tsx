import { MutableRefObject, useEffect, useId, useState } from "react";

import maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({ mapRef, onLoaded }: {
  mapRef: MutableRefObject<maplibregl.Map | undefined>,
  onLoaded: () => void,
}) {
  const mapId = useId();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;

    const mapElem = document.getElementById(mapId);
    if (mapElem == null) return;

    if (mapElem.children.length != 0)
      removeChildren(document.getElementById(mapId));

    mapRef.current = new maplibreGl.Map({
      container: mapId,
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=LBk0jSklMmNKwGftcTqc", // stylesheet location
      center: [-79, 34], // starting position [lng, lat]
      zoom: 5, // starting zoom
    }).on("load", () => { setIsLoaded(true); });
  }, [mapId, mapRef]);

  useEffect(() => {
    if (isLoaded) onLoaded();
  }, [isLoaded, onLoaded]);

  return <div id={mapId}></div>;
}

const removeChildren = (parent: HTMLElement | null) => {
  if (parent == null) return;

  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};
