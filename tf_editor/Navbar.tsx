import { A, Outlet, useNavigate } from "@solidjs/router";
import { Component, Show, createSignal } from "solid-js";

import styles from "./Navbar.module.css";
import { useApiClient } from "./api";

export const Navbar: Component = () => {
  const api = useApiClient();
  const navigate = useNavigate();
  const [username, setUsername] = createSignal<string | null | undefined>(api.loggedInUsername());
  api.addLoginStatusListener(() => {
    setUsername(api.loggedInUsername());
  });

  const handleLogOut = () => {
    api.logout();
    navigate("/");
  };

  return (
    <div class={styles.Wrapper}>
      <nav class={styles.Nav}>
        <A class={styles.NavButton} classList={{[styles.NavHeader]: true}} href="/">TourForge</A>
        <div style="flex: 1"></div>
        <a class={styles.NavButton} classList={{[styles.AdminPanelButton]: true}} href="/admin">Admin Panel</a>
        <Show when={username() === null}>
          <A class={styles.NavButton} classList={{[styles.LogInButton]: true}} href="/login">Log In</A>
        </Show>
        <Show when={username() !== null && username !== undefined}>
          <button class={styles.NavButton} classList={{[styles.LogOutButton]: true}} onClick={handleLogOut}>Log Out ({username()})</button>
        </Show>
      </nav>
      <main class={styles.Main}><Outlet /></main>
    </div>
  )
}