import type { Component } from "solid-js";

import styles from "./Home.module.css";
import { A } from "@solidjs/router";

export const Home: Component = () => {
  return (
    <>
      <div>Welcome to OpenTourBuilder!</div>
      <A href="/projects">Click here to view projects.</A>
    </>
  );
};