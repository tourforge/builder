import { Navigator, useNavigate } from "@solidjs/router";

import * as polyline from "./polyline";

import { LatLng, TourModel } from "./data";
import { apiBase } from "./settings";

const apiUrl = apiBase + "/api";

export type AssetKind = "any" | "narration" | "image" | "tiles";

export function useApiClient() {
  const navigate = useNavigate();

  return new ApiClient(navigate);
}

export type ApiProjectsList = ApiProject[];
export type ApiProject = {
  id: string;
  last_published: string;
} & ApiProjectData;
export type ApiProjectData = {
  name: string;
}

export type ApiToursList = ApiTour[];
export type ApiTour = {
  project: string;
  id: string;
} & ApiTourData;
export type ApiTourData = {
  title: string;
  content: TourModel;
}

export type ApiMembersList = ApiMember[];
export type ApiMember = {
  id: string;
  project: string;
  username: string;
} & ApiMemberData;
export type ApiMemberData = {
  admin: boolean;
  user: string;
}

export type ApiAssetsList = ApiAsset[];
export type ApiAsset = {
  id: string;
  project: string;
  name: string;
  file: string;
  type: "image" | "audio";
}

export type ApiUser = {
  id: string;
  username: string;
}

type ApiTokenResponse = {
  expiry: string,
  token: string,
}

export class ApiClient {
  private navigate: Navigator;
  private bc: BroadcastChannel = new BroadcastChannel("auth");
  private cbs: (() => void)[] = [];

  constructor(navigate: Navigator) {
    this.navigate = navigate;
    this.bc.addEventListener("message", ({ data }) => {
      if (data.type === "update") {
        for (const cb of this.cbs) {
          cb();
        }
      }
    });
  }

  addLoginStatusListener(cb: () => void) {
    this.cbs.push(cb);
    cb();
  }

  loggedInUsername() {
    return window.localStorage.getItem("otbUsername");
  }

  async listProjects() {
    return await this.apiRequest(`/projects`) as ApiProjectsList;
  }

  async getProject(id: string) {
    return await this.apiRequest(`/projects/${id}`) as ApiProject;
  }

  async updateProject(id: string, project: ApiProjectData) {
    return await this.apiRequest(`/projects/${id}`, "PUT", project) as ApiProject;
  }

  async createProject(project: ApiProjectData) {
    return await this.apiRequest(`/projects`, "POST", project) as ApiProject;
  }

  async deleteProject(id: string) {
    await this.apiRequest(`/projects/${id}`, "DELETE");
  }

  async listTours(pid: string) {
    return await this.apiRequest(`/projects/${pid}/tours`) as ApiToursList;
  }

  async getTour(pid: string, id: string) {
    return await this.apiRequest(`/projects/${pid}/tours/${id}`) as ApiTour;
  }

  async updateTour(pid: string, id: string, tour: ApiTourData) {
    return await this.apiRequest(`/projects/${pid}/tours/${id}`, "PUT", tour) as ApiTour;
  }

  async createTour(pid: string, tour: ApiTourData) {
    return await this.apiRequest(`/projects/${pid}/tours`, "POST", tour) as ApiTour;
  }

  async deleteTour(pid: string, id: string) {
    await this.apiRequest(`/projects/${pid}/tours/${id}`, "DELETE");
  }

  async listMembers(pid: string) {
    return await this.apiRequest(`/projects/${pid}/members`) as ApiMembersList;
  }

  async getMember(pid: string, id: string) {
    return await this.apiRequest(`/projects/${pid}/members/${id}`) as ApiMember;
  }

  async updateMember(pid: string, id: string, member: ApiMemberData) {
    return await this.apiRequest(`/projects/${pid}/members/${id}`, "PUT", member) as ApiMember;
  }

  async createMember(pid: string, member: ApiMemberData) {
    return await this.apiRequest(`/projects/${pid}/members`, "POST", member) as ApiMember;
  }

  async deleteMember(pid: string, id: string) {
    await this.apiRequest(`/projects/${pid}/members/${id}`, "DELETE");
  }

  async listAssets(pid: string, query: string = "", type?: "image" | "audio") {
    const lowerQuery = query.toLowerCase();
    const allAssets = await this.apiRequest(`/projects/${pid}/assets${type ? "?type="+type : ""}`) as ApiAssetsList;
    return allAssets.filter(asset => query === "" || asset.name.toLowerCase().includes(lowerQuery));
  }

  async getAssets(pid: string, ids: string[]) {
    const allAssets = await this.listAssets(pid);
    return ids.map(id => allAssets.find(asset => asset.id === id));
  }

  async getAsset(pid: string, id: string) {
    return await this.apiRequest(`/projects/${pid}/assets/${id}`) as ApiAsset;
  }

  async updateAssetName(pid: string, id: string, name: string) {
    return await this.apiRequest(`/projects/${pid}/assets/${id}`, "PATCH", { "name": name }) as ApiAsset;
  }

  async updateAssetFile(pid: string, id: string, file: Blob) {
    const form = new FormData();
    form.set("file", file);
    return await this.apiRequest(`/projects/${pid}/assets/${id}`, "PATCH", form) as ApiAsset;
  }

  async createAsset(pid: string, name: string, file: Blob) {
    const form = new FormData();
    form.set("name", name);
    form.set("project", pid);
    form.set("file", file);
    return await this.apiRequest(`/projects/${pid}/assets`, "POST", form) as ApiAsset;
  }

  async deleteAsset(pid: string, id: string) {
    await this.apiRequest(`/projects/${pid}/assets/${id}`, "DELETE");
  }

  async route(points: (LatLng & { control: "path" | "route" })[]) {
    const fullPath: LatLng[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];

  
      if (a.control !== "path" || b.control !== "path") {
        const resp = await this.apiRequest(`/route`, "POST", [[a.lat, a.lng], [b.lat, b.lng]]) as { path: string };
        const path: LatLng[] = polyline.decode(resp.path);
        
        if (a.control === "path") path.unshift(a);
        if (b.control === "path") path.push(b);
  
        fullPath.push(...path);
      } else {
        fullPath.push(a, b);
      }
    }
  
    return fullPath;
  }

  async publish(pid: string) {
    return await this.apiRequest(`/projects/${pid}/publish`, "POST");
  }

  async unpublish(pid: string) {
    return await this.apiRequest(`/projects/${pid}/unpublish`, "POST");
  }

  async getUser(username: string) {
    try {
      return await this.apiRequest(`/users/by_username/${username}`) as ApiUser;
    } catch (e) {
      return null;
    }
  }

  async apiRequest(path: string, method: string = "GET", body?: any): Promise<unknown> {
    const extraHeaders: { [_: string]: string } = {};
    if (body instanceof FormData) {
    } else if (body !== undefined) {
      body = JSON.stringify(body);
      extraHeaders["Content-Type"] = "application/json";
    }

    try {
      const resp = await fetch(`${apiUrl}${path}`, {
        method: method,
        body: body,
        credentials: "same-origin",
        headers: {
          "Accept": "application/json",
          "Authorization": `Token ${window.localStorage.getItem("otbLoginToken")}`,
          ...extraHeaders,
        }
      });
      
      if (resp.status >= 200 && resp.status <= 299) {
        if (resp.headers.get("Content-Type") === "application/json") {
          return await resp.json();
        } else {
          return await resp.blob();
        }
      } else if (resp.status == 401) {
        this.navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      } else {
        throw Error("Unexpected API failure: " + resp.statusText);
      }
    } catch (e) {
      debugger;
      throw e;
    }
  }

  async login(username: string, password: string): Promise<void> {
    const resp = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${window.btoa(`${username}:${password}`)}`
      }
    });

    if (resp.status >= 200 && resp.status <= 299) {
      const data = await resp.json() as ApiTokenResponse;
      window.localStorage.setItem("otbUsername", username);
      window.localStorage.setItem("otbLoginToken", data.token);
      this.authUpdateMessage();
    } else {
      throw Error("Failed to login: " + resp.statusText);
    }
  }

  logout() {
    window.localStorage.removeItem("otbUsername");
    window.localStorage.removeItem("otbLoginToken");
    this.authUpdateMessage();
  }

  authUpdateMessage() {
    for (const cb of this.cbs) {
      cb();
    }
    this.bc.postMessage({ type: "update" });
  }
}

/*
export async function openProject(name: string) {
  await invoke("open_project", { name });
}

export async function listTours(): Promise<{ id: string, name: string }[]> {
  return await invoke("list_tours", { projectName: currentProject() });
}

export async function createTour(tour: TourModel): Promise<void> {
  await invoke("create_tour", { projectName: currentProject(), tour });
}

export async function getTour(id: string): Promise<TourModel> {
  return await invoke("get_tour", { projectName: currentProject(), tourId: id });
}

export async function putTour(id: string, tour: TourModel): Promise<void> {
  await invoke("put_tour", { projectName: currentProject(), tourId: id, tour });
}

export async function deleteTour(id: string): Promise<void> {
  await invoke("delete_tour", { projectName: currentProject(), tourId: id });
}

export async function listAssets(query: string = "", kind: AssetKind = "any") {
  let assets: string[] = await invoke("list_assets", { projectName: currentProject() });
  assets = assets.filter(asset => asset.includes(query) && asset.length !== query.length);
  if (kind === "image")
    assets = assets.filter(asset => asset.endsWith(".png") || asset.endsWith(".jpg") || asset.endsWith(".jpeg"));
  if (kind == "narration")
    assets = assets.filter(asset => asset.endsWith(".mp3"));
  if (kind == "tiles")
    assets = assets.filter(asset => asset.endsWith(".mbtiles"));
  return assets;
}

export async function deleteAsset(asset: string): Promise<void> {
  await invoke("delete_asset", { projectName: currentProject(), assetName: asset });
}

export async function getAssetMeta(asset: string): Promise<AssetMeta> {
  return await invoke("get_asset_meta", { projectName: currentProject(), assetName: asset });
}

export async function setAssetMeta(asset: string, meta: AssetMeta): Promise<void> {
  return await invoke("set_asset_meta", { projectName: currentProject(), assetName: asset, meta });
}

export async function imageAssetUrl(name: string): Promise<string | null> {
  return `otb-asset://${currentProject()}/${name}`;
}

export async function chooseFile(): Promise<ChosenFile | null> {
  const path: string | null = await invoke("choose_file");
  return path !== null ? new ChosenFile(path) : null;
}

export async function importAsset(file: ChosenFile, name: string) {
  await invoke("import_asset", {
    path: file._path,
    projectName: currentProject(),
    name,
  });
}

export async function route(points: (LatLng & { control: "path" | "route" })[]): Promise<LatLng[]> {
  const fullPath: LatLng[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    const req = JSON.stringify({
      "locations": [a, b].map(ll => ({ "lat": ll.lat, "lon": ll.lng })),
      "costing": "auto",
      "units": "miles"
    });

    if (a.control !== "path" || b.control !== "path") {
      const resp: any = JSON.parse(await invoke("valhalla_route", { req }));
      const path: LatLng[] = resp.trip.legs
        .map((leg: any) => polyline.decode(leg.shape, 6))
        .reduce((a: any, b: any) => [...a, ...b]);
      
      if (a.control === "path") path.unshift(a);
      if (b.control === "path") path.push(b);

      fullPath.push(...path);
    } else {
      fullPath.push(a, b);
    }
  }

  return fullPath;
}

export async function exportProject(): Promise<void> {
  await invoke("export", { projectName: currentProject() });
}

function currentProject(): string | undefined {
  return (window as any).__OPENTOURBUILDER_CURRENT_PROJECT_NAME__;
}
*/