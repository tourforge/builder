import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { route } from "../src/api";
import { currentTourState } from "../src/state";

import MapLibreMap from "./maplibre_map";

export default function Map() {
  const [id, setId] = useState("");
  const [tour] = useRecoilState(currentTourState);
  const mapRef = useRef<maplibregl.Map | undefined>();

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const oldId = id;
    const newId = nanoid();
    setId(newId);

    route(tour.waypoints)
      .then(route => {
        map.addSource(`route${newId}`, {
          "type": "geojson",
          "data": {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "LineString",
              "coordinates": route.map(point => [point.lng, point.lat])
            }
          }
        });

        map.addLayer({
          "id": `route_layer${newId}`,
          "type": "line",
          "source": `route${newId}`,
          "layout": {
            "line-join": "round",
            "line-cap": "round"
          },
          "paint": {
            "line-color": "#888",
            "line-width": 8
          },
        }, `waypoints_layer${newId}`);
      })
      .catch(err => console.error(`Failed to calculate route: ${err}`))
      .finally(() => {
        if (map.getLayer(`route_layer${oldId}`))
          map.removeLayer(`route_layer${oldId}`);
        if (map.getSource(`route${oldId}`))
          map.removeSource(`route${oldId}`);
      });

    try {
      map.addSource(`waypoints${newId}`, {
        "type": "geojson",
        "data": {
          "type": "FeatureCollection",
          "features": tour.waypoints.map(waypoint => ({
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "Point",
              "coordinates": [waypoint.lng, waypoint.lat]
            }
          }))
        }
      });

      map.addLayer({
        "id": `waypoints_layer${newId}`,
        "type": "circle",
        "source": `waypoints${newId}`,
        "paint": {
          "circle-radius": 6,
          "circle-color": "#B42222"
        },
      });
    } finally {
      if (map.getLayer(`waypoints_layer${oldId}`))
        map.removeLayer(`waypoints_layer${oldId}`);
      if (map.getSource(`waypoints${oldId}`))
        map.removeSource(`waypoints${oldId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour, mapRef]);

  return (
    <MapLibreMap mapRef={mapRef} />
  );
}
