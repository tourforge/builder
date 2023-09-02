import { Route, Routes } from "@solidjs/router";
import type { Component } from "solid-js";

import { ProjectAssetsEditor } from "./ProjectAssetsEditor";
import { Home } from "./Home";
import { Login } from "./Login";
import { ProjectEditor } from "./ProjectEditor";
import { ProjectsList } from "./ProjectsList";
import { TourEditor } from "./TourEditor";

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" component={Home} />
      <Route path="/projects" component={ProjectsList} />
      <Route path="/projects/:pid" component={ProjectEditor}>
        <Route path="/" component={Blank} />
        <Route path="/assets" component={ProjectAssetsEditor} />
        <Route path="/tours/:tid" component={TourEditor} />
      </Route>
      <Route path="/login" component={Login} />
    </Routes>
  );
};

const Blank: Component = () => <></>;

export default App;
