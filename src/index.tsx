/* @refresh reload */
import { render } from "solid-js/web";
import { HashRouter, Route } from "@solidjs/router";
import { Component } from "solid-js";

import "./index.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Navbar } from "./Navbar";
import { Home } from "./pages/home/Home";
import { ProjectEditor } from "./pages/project/ProjectEditor";
import { ProjectAssetsEditor } from "./pages/project/ProjectAssetsEditor";
import { ProjectManager } from "./pages/project/ProjectManager";
import { TourEditor } from "./pages/project/TourEditor";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

const Blank: Component = () => <></>;

render(
  () => (
    <HashRouter>
      <Route path="/" component={Navbar}>
        <Route path="/" component={Home} />
        <Route path="/projects/:pid" component={ProjectEditor}>
          <Route path="/" component={Blank} />
          <Route path="/assets" component={ProjectAssetsEditor} />
          <Route path="/manage" component={ProjectManager} />
          <Route path="/tours/:tid" component={TourEditor} />
        </Route>
      </Route>
    </HashRouter>
  ),
  root!
);


