import { LatLng } from "./data";
import * as polyline from "./polyline";

export const route = async (points: (LatLng & { control: "path" | "route" })[]) => {
  if (points.length === 0) {
    return [];
  }
  if (points.length === 1) {
    return [points[0]];
  }

  const reqJson = {
    "locations": points.map(point => ({
      "lat": point.lat,
      "lon": point.lng,
    })),
    "costing": "auto",
    "units": "miles",
  };

  const resp = await fetch("https://valhalla1.openstreetmap.de/route", {
    method: "POST",
    body: JSON.stringify(reqJson),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const respBody: {
    trip: {
      legs: {
        shape: string
      }[]
    }
  } = await resp.json();

  const outPoints = [points[0] as LatLng];
  let i = 1;
  for (const leg of respBody.trip.legs) {
    if (points[i].control === "route") {
      outPoints.push(...polyline.decode(leg.shape).map(decoded => ({ lat: decoded.lat / 10.0, lng: decoded.lng / 10.0 })));
    }
    i++;
  }

  return outPoints;
}