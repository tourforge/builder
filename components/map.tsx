import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { route } from "../src/api";
import { currentTourState } from "../src/state";

import MapLibreMap from "./maplibre_map";

import { Marker } from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";

export default function Map() {
  // we depend on the tour and need a ref with it for `handleMarkerDragEnd` to work
  const [tour, setTour] = useRecoilState(currentTourState);
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const mapMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const mapRef = useRef<maplibregl.Map | undefined>();

  const createMarkerElement = (index: number) => {
    const markerElement = document.createElement("div");
    markerElement.classList.add("marker");
    markerElement.innerText = `${index + 1}`;
    return markerElement;
  };

  // this function must be written very carefully, since we set it once as a callback
  // on each marker and it needs to always operate on the most up-to-date state.
  const handleMarkerDragEnd = useCallback((id: string) => {
    const marker = mapMarkersRef.current[id];
    if (!marker) return;

    const idx = tourRef.current.waypoints.findIndex(w => w.id === id);
    if (idx < 0) return;

    setTour({
      ...tourRef.current,
      waypoints: [
        ...tourRef.current.waypoints.slice(0, idx),
        {
          ...tourRef.current.waypoints[idx],
          lat: marker.getLngLat().lat,
          lng: marker.getLngLat().lng,
        },
        ...tourRef.current.waypoints.slice(idx + 1),
      ],
    });
  }, [setTour]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tour.waypoints.forEach((waypoint, index) => {
      if (mapMarkersRef.current[waypoint.id]) {
        mapMarkersRef.current[waypoint.id].setLngLat(waypoint);
      } else {
        mapMarkersRef.current[waypoint.id] = new Marker({
          draggable: true,
          element: createMarkerElement(index),
        }).setLngLat(waypoint)
          .addTo(map)
          .on("dragend", () => handleMarkerDragEnd(waypoint.id));
      }
    });
  }, [tour, handleMarkerDragEnd]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tour.waypoints.length >= 2) {
      route(tour.waypoints)
        .then(route => {
          const routeGeoJson: GeoJSON.GeoJSON = {
            "type": "Feature",
            "properties": {},
            "geometry": {
              "type": "LineString",
              "coordinates": route.map(point => [point.lng, point.lat])
            }
          };

          if (!map.getSource("route")) {
            map.addSource("route", {
              "type": "geojson",
              "data": routeGeoJson
            });
          } else {
            (map.getSource("route") as GeoJSONSource).setData(routeGeoJson);
          }

          if (!map.getLayer("route_layer")) {
            map.addLayer({
              "id": "route_layer",
              "type": "line",
              "source": "route",
              "layout": {
                "line-join": "round",
                "line-cap": "round"
              },
              "paint": {
                "line-color": "#f00",
                "line-width": 8
              },
            });
          }
        })
        .catch(err => console.error(`Failed to calculate route: ${err}`));
    } else {
      if (map.getLayer("route_layer"))
        map.removeLayer("route_layer");
      if (map.getSource("route"))
        map.removeSource("route");
    }
  }, [tour]);

  return (
    <MapLibreMap mapRef={mapRef} />
  );
}
