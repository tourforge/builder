import { atom } from "recoil";

import { TourModel } from "./data";

export const currentTourState = atom<TourModel>({
  key: "currentTourState",
  default: {
    name: "Untitled",
    desc: "",
    waypoints: [],
    gallery: [],
    path: "",
    pois: [],
  },
});
