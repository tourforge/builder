import { Route, Routes } from "@solidjs/router";
import type { Component } from "solid-js";

import { Navbar } from "./Navbar";
import { Home } from "./pages/home/Home";
import { Login } from "./pages/login/Login";
import { ProjectAssetsEditor } from "./pages/project/ProjectAssetsEditor";
import { ProjectEditor } from "./pages/project/ProjectEditor";
import { ProjectsList } from "./pages/project/ProjectsList";
import { TourEditor } from "./pages/project/TourEditor";

const App: Component = () => {
  return (
    <Routes>
      <Route path="/" component={Navbar}>
        <Route path="/" component={Home} />
        <Route path="/projects" component={ProjectsList} />
        <Route path="/projects/:pid" component={ProjectEditor}>
          <Route path="/" component={Blank} />
          <Route path="/assets" component={ProjectAssetsEditor} />
          <Route path="/tours/:tid" component={TourEditor} />
        </Route>
        <Route path="/login" component={Login} />
      </Route>
    </Routes>
  );
};

const Blank: Component = () => <></>;

export default App;
