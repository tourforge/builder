import toast from "solid-toast";

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

  let resp: Response;
  let respBody: unknown;
  try {
    resp = await fetch("https://valhalla1.openstreetmap.de/route", {
      method: "POST",
      body: JSON.stringify(reqJson),
      headers: {
        "Content-Type": "application/json",
      },
    });

    respBody = await resp.json();
  } catch (err) {
    console.error("Error while calculating route:", err);
    toast.error("Unable to generate the path connecting the tour stops along roads. This is likely due to a service connectivity issue. Please try again later and report the issue if it persists.");
    return;
  }

  if (!resp.ok) {
    console.error("Non-OK Valhalla response:", resp);
    if (typeof respBody === "object" && respBody && "error" in respBody && typeof respBody.error === "string" && respBody.error) {
      toast.error("Unable to generate the path connecting the tour stops along roads. The following error message was received from the external service used to perform this task: " + respBody.error);
    } else {
      toast.error("Unable to generate the path connecting the tour stops along roads. This is likely due to a bug or a temporary service outage. Please try again later and report the issue if it persists.");
    }
    return;
  }

  if (respBody && typeof respBody === "object"
    && "trip" in respBody && respBody.trip && typeof respBody.trip === "object"
    && "legs" in respBody.trip && respBody.trip.legs && typeof respBody.trip.legs === "object" && Array.isArray(respBody.trip.legs)) {
    const outPoints = [{ lat: points[0].lat, lng: points[0].lng }];
    let i = 1;
    for (const leg of respBody.trip.legs) {
      if (!("shape" in leg) || typeof leg.shape !== "string" || !leg.shape) {
        continue;
      }

      if (points[i].control === "route") {
        outPoints.push(...polyline.decode(leg.shape).map(decoded => ({ lat: decoded.lat / 10.0, lng: decoded.lng / 10.0 })));
      } else {
        outPoints.push({ lat: points[i].lat, lng: points[i].lng });
      }
      i++;
    }

    return outPoints;
  } else {
    console.error("Malformed Valhalla response:", respBody);
    toast.error("Unable to generate the path connecting the tour stops along roads. An invalid response was received from the external service used to perform this task. Please try again later and report the issue if it persists.");
  }
}