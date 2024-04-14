// NOTE: This file is bundled separately from the rest of the files in the project. Importing
// certain files doesn't work because the bundler is less featureful than what Vite provides.
// It is bundled separately because it is included in the project bundles generated in
// `src/export.ts`.

import { ProjectModelSchema } from "../data";

const projectPromise = (async () => {
  const result = ProjectModelSchema.safeParse(await (await fetch("tourforge.json")).json());
  if (result.success) {
    return result.data;
  } else {
    console.error(result.error);
    return undefined;
  }
})();

const fetchAsBlob = async (asset: string) => {
  const resp = await fetch(asset);
  const blob = await resp.blob();
  return blob;
};

// Add an event listener for postMessages so the tour builder can download tour assets
window.addEventListener("message", async (ev) => {
  try {
    const source = ev.source;
    if (source == null) {
      console.error("Cannot respond to postMessage if source is null");
      return;
    }

    const options = { targetOrigin: "*" };

    const data = ev.data;
    if (typeof data !== "string") {
      console.error("Invalid data passed in postMessage");
      source.postMessage({ status: "failure", asset: data }, options);
      return;
    }

    if (data === "tourforge.json") {
      console.log("Serving tourforge.json to postMessage sender");
      source.postMessage({ status: "success", asset: data, data: await fetchAsBlob("tourforge.json") }, options);
      return;
    }

    // Security: only serve assets that are part of the project
    const project = await projectPromise;
    if (Object.values(project?.assets ?? {}).map(a => a.hash).includes(data)) {
      console.log("Serving asset with hash " + data + " to postMessage sender");
      source.postMessage({ status: "success", asset: data, data: await fetchAsBlob(data) }, options);
      return;
    }

    console.error("Requested asset did not match an asset in the project.");
    source.postMessage({ status: "failure", asset: data }, options);
  } catch (e) {
    console.error("Got an exception while trying to respond to postMessage:", e);
    const source = ev.source;
    if (source != null) {
      source.postMessage({ status: "failure", asset: ev.data }, { targetOrigin: "*" });
    }
  }
});

// Add a link to the tour builder
const template = document.querySelector<HTMLTemplateElement>("template#content")!;
const clone = template.content.cloneNode(true) as HTMLElement;
const link = clone.querySelector<HTMLAnchorElement>("a.edit-tour-link")!;
const linkText = "https://tourforge.github.io/builder?tourforge-load-project=" + encodeURIComponent(window.location.href);
link.href = linkText;
link.innerText = linkText;
document.body.appendChild(clone);
