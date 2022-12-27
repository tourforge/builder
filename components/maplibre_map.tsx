import { useLayoutEffect, useState, useEffect, MutableRefObject } from "react";

import maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapLibreMap({ mapRef }: { mapRef: MutableRefObject<maplibregl.Map | undefined> }) {
  const [mapId, _setMapId] = useState("map");
  const [map, setMap] = useState<maplibregl.Map | undefined>();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (map) return;

    const mapElem = document.getElementById(mapId);
    if (mapElem == null) return;

    if (mapElem.children.length != 0)
      removeChildren(document.getElementById(mapId));

    setMap(new maplibreGl.Map({
      container: mapId,
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=LBk0jSklMmNKwGftcTqc", // stylesheet location
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 3, // starting zoom
    }));
  });

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  return <div id={mapId}></div>;
}

const removeChildren = (parent: HTMLElement | null) => {
  if (parent == null) return;

  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};
