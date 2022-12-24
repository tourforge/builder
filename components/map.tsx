import maplibreGl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { nanoid } from "nanoid";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function Map() {
  const [mapId, _setMapId] = useState("map");
  const [map, setMap] = useState<maplibregl.Map | undefined>();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (map) return;

    const mapElem = document.getElementById(mapId);
    if (mapElem == null) return;

    if (mapElem.children.length != 0)
      removeChildren(document.getElementById(mapId));

    let curMap: maplibregl.Map;
    setMap(curMap = new maplibreGl.Map({
      container: mapId,
      style: "https://api.maptiler.com/maps/streets-v2/style.json?key=LBk0jSklMmNKwGftcTqc", // stylesheet location
      center: [-74.5, 40], // starting position [lng, lat]
      zoom: 3, // starting zoom
    }));

    curMap.on("load", () => {
      var marker = new maplibreGl.Marker({
        color: "#FFFFFF"
      }).setLngLat([-74.5, 40])
        .addTo(curMap!);
    });
  });

  return <div id={mapId}></div>;
}

const removeChildren = (parent: HTMLElement | null) => {
  if (parent == null) return;

  while (parent.lastChild) {
    parent.removeChild(parent.lastChild);
  }
};
