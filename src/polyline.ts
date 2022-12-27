// MIT License
// 
// Copyright (c) 2022 Placemark
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { LatLng } from "./data";

// https://github.com/mapbox/polyline/blob/master/src/polyline.js

// Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
//
// Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
// by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)

function py2_round(value: number) {
  // Google's polyline algorithm uses the same rounding strategy as Python 2,
  // which is different from JS for negative values
  return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

function encodeNumber(current: number, previous: number, factor: number) {
  current = py2_round(current * factor);
  previous = py2_round(previous * factor);
  let coordinate = current - previous;
  coordinate <<= 1;
  if (current - previous < 0) {
    coordinate = ~coordinate;
  }
  let output = "";
  while (coordinate >= 0x20) {
    output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
    coordinate >>= 5;
  }
  output += String.fromCharCode(coordinate + 63);
  return output;
}

function resultChange(result: number) {
  return result & 1 ? ~(result >> 1) : result >> 1;
}

/**
 * Decodes any string into a LatLng coordinates array.
 *
 * Any string is a valid polyline, but if you provide this
 * with an arbitrary string, it'll produce coordinates well
 * outside of the normal range.
 */
export function decode(str: string, precision: number = 5): LatLng[] {
  const factor = Math.pow(10, precision);
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  let shift = 0;
  let result = 0;
  let byte = null;

  let latitude_change: number;
  let longitude_change: number;

  // Coordinates have variable length when encoded, so just keep
  // track of whether we've hit the end of the string. In each
  // loop iteration, a single coordinate is decoded.
  while (index < str.length) {
    // Reset shift, result, and byte
    byte = null;
    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    latitude_change = resultChange(result);

    shift = result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = resultChange(result);

    lat += latitude_change;
    lng += longitude_change;

    coordinates.push({ "lng": lng / factor, "lat": lat / factor });
  }

  return coordinates;
}

/**
 * Encodes the given LatLng coordinates array.
 *
 * @param coordinates LatLng coordinates
 * @returns encoded polyline
 */
export function encode(coordinates: LatLng[], precision: number = 5) {
  if (!coordinates.length) {
    return "";
  }
  const factor = Math.pow(10, precision);

  let output =
    encodeNumber(coordinates[0].lat, 0, factor) +
    encodeNumber(coordinates[0].lng, 0, factor);

  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i];
    const b = coordinates[i - 1];
    output += encodeNumber(a.lat, b.lat, factor);
    output += encodeNumber(a.lng, b.lng, factor);
  }

  return output;
}
