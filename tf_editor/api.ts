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

export type ApiRole = {
  role: "admin" | "member";
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

export class AuthError extends Error {
  constructor(message: string) {
      super(message);
      this.name = "AuthError";
  }
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
  }

  loggedInUsername() {
    return window.localStorage.getItem("tfUsername");
  }

  async listProjects(extraOptions?: { forceAuth?: boolean }) {
    return await this.apiRequest(`/projects`, "GET", undefined, extraOptions) as ApiProjectsList;
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

  async getRole(pid: string) {
    return await this.apiRequest(`/projects/${pid}/role`) as ApiRole;
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

  async apiRequest(path: string, method: string = "GET", body?: any, extraOptions?: { forceAuth?: boolean }): Promise<unknown> {
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
          "Authorization": `Token ${window.localStorage.getItem("tfLoginToken")}`,
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
        this.logout();

        if (extraOptions?.forceAuth === undefined || extraOptions?.forceAuth) {
          this.navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        } else {
          throw new AuthError("API authentication failed.");
        }
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
      window.localStorage.setItem("tfUsername", username);
      window.localStorage.setItem("tfLoginToken", data.token);
      this.authUpdateMessage();
    } else {
      throw Error("Failed to login: " + resp.statusText);
    }
  }

  logout() {
    window.localStorage.removeItem("tfUsername");
    window.localStorage.removeItem("tfLoginToken");
    this.authUpdateMessage();
  }

  authUpdateMessage() {
    for (const cb of this.cbs) {
      cb();
    }
    this.bc.postMessage({ type: "update" });
  }
}
