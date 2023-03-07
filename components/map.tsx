import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

import type { GeoJSONSource } from "maplibre-gl";
import { Marker } from "maplibre-gl";

import * as polyline from "src/polyline";
import { replaceElementAtIndex, SetterOrUpdater } from "src/state";

import MapLibreMap from "./maplibre_map";
import { LatLng, TourModel } from "src/data";
import { circle } from "@turf/turf";

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

  function createMarkerElement(index: number | null) {
    if (index !== null) {
      const markerElement = document.createElement("div");
      markerElement.classList.add("marker");
      markerElement.innerText = `${index + 1}`;
      return markerElement;
    } else {
      const markerElement = document.createElement("div");
      markerElement.classList.add("marker-control");
      return markerElement;
    }
  }

  function updateMarkerElement(element: HTMLElement, index: number | null) {
    if (index !== null)
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

  function createPoiMarkerElement() {
    const markerElement = document.createElement("div");
    markerElement.classList.add("marker-poi");
    markerElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 512\" style=\"width: 16px; height: 16px\"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path fill=\"white\" d=\"M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z\"/></svg>";
    return markerElement;
  }

  const handlePoiMarkerDragEnd = useCallback((id: string) => {
    const marker = mapMarkersRef.current[id];
    if (!marker) return;

    const idx = tourRef.current.pois.findIndex(p => p.id === id);
    if (idx < 0) return;

    setTour({
      ...tourRef.current,
      pois: replaceElementAtIndex(
        tourRef.current.pois,
        idx,
        {
          ...tourRef.current.pois[idx],
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

    // waypoint symbols
    tour.waypoints.forEach(waypoint => {
      let index: number | null = tour.waypoints.filter(w => w.type === "waypoint").findIndex(w => w.id === waypoint.id);
      if (index === -1) index = null;

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

    // poi symbols
    tour.pois.forEach(poi => {
      if (mapMarkersRef.current[poi.id]) {
        mapMarkersRef.current[poi.id].setLngLat(poi);
      } else {
        mapMarkersRef.current[poi.id] = new Marker({
          draggable: true,
          element: createPoiMarkerElement(),
        }).setLngLat(poi)
          .addTo(map)
          .on("dragend", () => handlePoiMarkerDragEnd(poi.id));
      }
    });

    // manage the records on which markers are currently present
    for (const id in mapMarkersRef.current) {
      if (!tour.waypoints.some(waypoint => waypoint.id == id) && !tour.pois.some(poi => poi.id == id)) {
        mapMarkersRef.current[id].remove();
        delete mapMarkersRef.current[id];
      }
    }
  }, [tour, handleMarkerDragEnd, handlePoiMarkerDragEnd]);

  // This effect manages the map's GeoJSON data
  useEffect(() => {
    const map = mapRef.current;
    if (!isLoaded || !map) return;

    if (tour.waypoints.length > 0) {
      const triggerRadiiGeoJson: GeoJSON.GeoJSON = {
        "type": "FeatureCollection",
        "features": tour.waypoints.filter(w => w.type === "waypoint").map(waypoint => (
          circle(
            [waypoint.lng, waypoint.lat],
            waypoint.type === "waypoint" ? waypoint.trigger_radius : 0,
            { steps: 80, units: "meters" },
          )
        )),
      };

      if (!map.getSource("trigger_radii")) {
        map.addSource("trigger_radii", {
          "type": "geojson",
          "data": triggerRadiiGeoJson,
        });
      } else {
        (map.getSource("trigger_radii") as GeoJSONSource).setData(triggerRadiiGeoJson);
      }

      if (!map.getLayer("trigger_radii_layer")) {
        map.addLayer({
          "id": "trigger_radii_layer",
          "type": "fill",
          "source": "trigger_radii",
          "layout": {},
          "paint": {
            "fill-color": "rgba(239, 140, 47, 0.5)"
          },
        });
      }
    }

    if (tour.path.length > 0) {
      const route = polyline.decode(tour.path);

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
    } else {
      if (map.getLayer("route_layer"))
        map.removeLayer("route_layer");
      if (map.getSource("route"))
        map.removeSource("route");
    }
  }, [isLoaded, tour.path, tour.waypoints]);

  // Set up an event on the map for when the center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (centerRef)
      centerRef.current = map.getCenter();

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
