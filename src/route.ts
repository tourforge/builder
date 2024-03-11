import { type LatLng } from "./data";
import * as polyline from "./polyline";

export class RoutingError extends Error {
}

export const route = async (points: Array<LatLng & { control: "path" | "route" }>) => {
  if (points.length === 0) {
    return [];
  }
  if (points.length === 1) {
    return [points[0]];
  }

  const reqJson = {
    locations: points.map(point => ({
      lat: point.lat,
      lon: point.lng,
    })),
    costing: "auto",
    units: "miles",
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
    throw new RoutingError(
      "Unable to generate the path connecting the tour stops along roads. " +
      "This is likely due to a service connectivity issue. " +
      "Please try again later and report the issue if it persists.",
      { cause: err },
    );
  }

  if (!resp.ok) {
    if (typeof respBody === "object" && respBody != null && "error" in respBody && typeof respBody.error === "string") {
      throw new RoutingError(
        "Unable to generate the path connecting the tour stops along roads. " +
        "The following error message was received from the external service used to perform this task: " +
        respBody.error,
      );
    } else {
      throw new RoutingError(
        "Unable to generate the path connecting the tour stops along roads. " +
        "This is likely due to a bug or a temporary service outage. " +
        "Please try again later and report the issue if it persists.",
      );
    }
  }

  if (typeof respBody === "object" && respBody != null &&
    "trip" in respBody && typeof respBody.trip === "object" && respBody.trip != null &&
    "legs" in respBody.trip && typeof respBody.trip.legs === "object" && respBody.trip.legs != null && Array.isArray(respBody.trip.legs)) {
    const outPoints = [{ lat: points[0].lat, lng: points[0].lng }];
    let i = 1;
    for (const leg of respBody.trip.legs) {
      if (typeof leg !== "object" || leg == null || !("shape" in leg) || typeof leg.shape !== "string") {
        console.warn("Invalid trip leg, ignoring and continuing route calculation...", leg);
        continue;
      }
      // just asserting that the above code actually validated the type.
      const assertedLeg: { shape: string } = leg;

      if (points[i].control === "route") {
        outPoints.push(...polyline.decode(assertedLeg.shape).map(decoded => ({ lat: decoded.lat / 10.0, lng: decoded.lng / 10.0 })));
      } else {
        outPoints.push({ lat: points[i].lat, lng: points[i].lng });
      }
      i++;
    }

    return outPoints;
  } else {
    throw new RoutingError(
      "Unable to generate the path connecting the tour stops along roads. " +
      "An invalid response was received from the external service used to perform this task. " +
      "Please try again later and report the issue if it persists.",
    );
  }
};
