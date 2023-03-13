import { createContext, RefObject, useContext } from "react";
import { LatLng } from "src/data";

export interface MapController {
  center: LatLng,
}

export const MapControllerContext = createContext<RefObject<MapController>>({ current: null });

export default function useMapController() {
  return useContext(MapControllerContext);
} 
