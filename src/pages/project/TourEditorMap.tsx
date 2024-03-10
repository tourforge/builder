import { createSignal, type Component, createEffect } from "solid-js";
import * as maplibregl from "maplibre-gl";
import circle from "@turf/circle";

import * as polyline from "../../polyline";
import { MapLibreMap, useMapController } from "./MapLibreMap";

import styles from "./TourEditorMap.module.css";
import { useTour } from "../../hooks/Tour";

export const TourEditorMap: Component = () => {
  const mapSignal = useMapController();
  const [tour, setTour] = useTour();

  const [isLoaded, setIsLoaded] = createSignal(mapSignal()?.loaded() ?? false);
  const [markers, setMarkers] = createSignal<{ [id: string]: maplibregl.Marker }>({});

  const createMarkerElement = (index: number | null) => {
    if (index !== null) {
      const markerElement = document.createElement("div");
      markerElement.classList.add(styles.Marker);
      markerElement.innerText = `${index + 1}`;
      return markerElement;
    } else {
      const markerElement = document.createElement("div");
      markerElement.classList.add(styles.ControlMarker);
      return markerElement;
    }
  };

  const updateMarkerElement = (element: HTMLElement, index: number | null) => {
    if (index !== null)
      element.innerText = `${index + 1}`;
  };

  const handleMarkerDragEnd = (id: string) => {
    const marker = markers()[id];
    if (!marker) return;

    const idx = tour()!.route.findIndex(w => w.id === id);
    if (idx < 0) return;

    setTour({
      ...tour()!,
      route: [
        ...tour()!.route.slice(0, idx),
        {
          ...tour()!.route[idx],
          lat: marker.getLngLat().lat,
          lng: marker.getLngLat().lng,
        },
        ...tour()!.route.slice(idx + 1),
      ],
    });
  };

  const createPoiMarkerElement = () => {
    const markerElement = document.createElement("div");
    markerElement.classList.add(styles.PoiMarker);
    markerElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 192 512\" style=\"width: 16px; height: 16px\"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path fill=\"white\" d=\"M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z\"/></svg>";
    return markerElement;
  };

  const handlePoiMarkerDragEnd = (id: string) => {
    const marker = markers()[id];
    if (!marker) return;

    const idx = tour()!.route.findIndex(w => w.id === id);
    if (idx < 0) return;

    setTour({
      ...tour()!,
      pois: [
        ...tour()!.pois.slice(0, idx),
        {
          ...tour()!.pois[idx],
          lat: marker.getLngLat().lat,
          lng: marker.getLngLat().lng,
        },
        ...tour()!.pois.slice(idx + 1),
      ],
    });
  };

  // This effect manages the markers on the map
  createEffect(() => {
    const map = mapSignal();
    if (!map) return;
    if (!tour()) return;

    // waypoint symbols
    tour()!.route.forEach(waypoint => {
      let index: number | null = tour()!.route.filter(w => w.type === "stop").findIndex(w => w.id === waypoint.id);
      if (index === -1) index = null;

      if (markers()[waypoint.id]) {
        markers()[waypoint.id].setLngLat(waypoint);
        updateMarkerElement(markers()[waypoint.id].getElement(), index);
      } else {
        setMarkers({
          ...markers(),
          [waypoint.id]: new maplibregl.Marker({
            draggable: true,
            element: createMarkerElement(index),
          }).setLngLat(waypoint)
            .addTo(map)
            .on("dragend", () => handleMarkerDragEnd(waypoint.id)),
        }); 
      }
    });

    // poi symbols
    tour()!.pois.forEach(poi => {
      if (markers()[poi.id]) {
        markers()[poi.id].setLngLat(poi);
      } else {
        setMarkers({
          ...markers(),
          [poi.id]: new maplibregl.Marker({
            draggable: true,
            element: createPoiMarkerElement(),
          }).setLngLat(poi)
            .addTo(map)
            .on("dragend", () => handlePoiMarkerDragEnd(poi.id)),
        });
      }
    });

    // manage the records on which markers are currently present
    for (const id in markers()) {
      if (!tour()!.route.some(waypoint => waypoint.id == id) && !tour()!.pois.some(poi => poi.id == id)) {
        markers()[id].remove();
        const { [id]: _, ...newMarkers } = markers();
        setMarkers(newMarkers);
      }
    }
  });

  // This effect manages the map's GeoJSON data
  createEffect(() => {
    const map = mapSignal();
    if (!isLoaded() || !map) return;
    if (!tour()) return;

    if (tour()!.route.length > 0) {
      const triggerRadiiGeoJson: GeoJSON.GeoJSON = {
        "type": "FeatureCollection",
        "features": tour()!.route.filter(w => w.type === "stop").map(waypoint => (
          circle(
            [waypoint.lng, waypoint.lat],
            waypoint.type === "stop" ? waypoint.trigger_radius : 0,
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
        (map.getSource("trigger_radii") as maplibregl.GeoJSONSource).setData(triggerRadiiGeoJson);
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

    if (tour()!.path.length > 0) {
      const route = polyline.decode(tour()!.path);

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
        (map.getSource("route") as maplibregl.GeoJSONSource).setData(routeGeoJson);
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
  });

  return <MapLibreMap onLoad={() => setIsLoaded(true)} />;
};