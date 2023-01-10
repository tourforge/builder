import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

import type { GeoJSONSource } from "maplibre-gl";
import { Marker } from "maplibre-gl";

import { route } from "src/api";
import { replaceElementAtIndex, SetterOrUpdater } from "src/state";

import MapLibreMap from "./maplibre_map";
import { LatLng, TourModel } from "src/data";

export default function Map({ centerRef, tour, setTour }: {
  centerRef?: MutableRefObject<LatLng> | undefined,
  tour: TourModel,
  setTour: SetterOrUpdater<TourModel>,
}) {
  // we depend on the tour and need a ref with it for `handleMarkerDragEnd` to work
  const tourRef = useRef(tour);
  tourRef.current = tour;

  const [isLoaded, setIsLoaded] = useState(false);

  const mapMarkersRef = useRef<{ [id: string]: maplibregl.Marker }>({});
  const mapRef = useRef<maplibregl.Map | undefined>();

  function createMarkerElement(index: number) {
    const markerElement = document.createElement("div");
    markerElement.classList.add("marker");
    markerElement.innerText = `${index + 1}`;
    return markerElement;
  }

  function updateMarkerElement(element: HTMLElement, index: number) {
    element.innerText = `${index + 1}`;
  }

  // this function must be written very carefully, since we set it once as a callback
  // on each marker and it needs to always operate on the most up-to-date state.
  const handleMarkerDragEnd = useCallback((id: string) => {
    const marker = mapMarkersRef.current[id];
    if (!marker) return;

    const idx = tourRef.current.waypoints.findIndex(w => w.id === id);
    if (idx < 0) return;

    setTour({
      ...tourRef.current,
      waypoints: replaceElementAtIndex(
        tourRef.current.waypoints,
        idx,
        {
          ...tourRef.current.waypoints[idx],
          lat: marker.getLngLat().lat,
          lng: marker.getLngLat().lng,
        },
      )
    });
  }, [setTour]);

  // This effect manages the markers on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tour.waypoints.forEach((waypoint, index) => {
      if (mapMarkersRef.current[waypoint.id]) {
        mapMarkersRef.current[waypoint.id].setLngLat(waypoint);
        updateMarkerElement(mapMarkersRef.current[waypoint.id].getElement(), index);
      } else {
        mapMarkersRef.current[waypoint.id] = new Marker({
          draggable: true,
          element: createMarkerElement(index),
        }).setLngLat(waypoint)
          .addTo(map)
          .on("dragend", () => handleMarkerDragEnd(waypoint.id));
      }
    });

    for (const id in mapMarkersRef.current) {
      if (!tour.waypoints.some(waypoint => waypoint.id == id)) {
        mapMarkersRef.current[id].remove();
        delete mapMarkersRef.current[id];
      }
    }
  }, [tour, handleMarkerDragEnd]);

  // This effect manages the route on the map
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
                "line-width": 4
              },
            });
          }
        })
        .catch(err => {
          console.error(`Failed to calculate route: ${err}`);
        });
    } else {
      if (map.getLayer("route_layer"))
        map.removeLayer("route_layer");
      if (map.getSource("route"))
        map.removeSource("route");
    }
  }, [tour]);

  // Set up an event on the map for when the center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.on("move", () => {
      if (centerRef) {
        centerRef.current = {
          "lat": map.getCenter().lat,
          "lng": map.getCenter().lng,
        };
      }
    });
  }, [centerRef, isLoaded]);

  return (
    <MapLibreMap mapRef={mapRef} onLoaded={() => setIsLoaded(true)} />
  );
}
