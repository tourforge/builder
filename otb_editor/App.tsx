import { Route, Routes } from "@solidjs/router";
import type { Component } from "solid-js";

import { ProjectAssetsEditor } from "./pages/project/ProjectAssetsEditor";
import { Home } from "./pages/home/Home";
import { Login } from "./pages/login/Login";
import { ProjectEditor } from "./pages/project/ProjectEditor";
import { ProjectsList } from "./pages/project/ProjectsList";
import { TourEditor } from "./pages/project/TourEditor";

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
