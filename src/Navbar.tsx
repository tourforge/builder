import { A } from "@solidjs/router";
import { Component, Show, JSX, createResource, onCleanup } from "solid-js";

import styles from "./Navbar.module.css";
import { useDB } from "./db";

export const Navbar: Component<{children?: JSX.Element}> = (props) => {
  const db = useDB();
  const [isPersistent] = createResource(() => db.isPersistent());
  const [storageEstimate, { refetch: reestimate }] = createResource(() => db.storageEstimate());
  const usedMB = () => {
    const est = storageEstimate();
    if (est === undefined || est.usage === undefined) {
      return undefined;
    }

    return (est.usage / 1024 / 1024).toFixed(2) + "MB";
  };
  const quotaMB = () => {
    const est = storageEstimate();
    if (est === undefined || est.quota === undefined) {
      return undefined;
    }

    return (est.quota / 1024 / 1024).toFixed(2) + "MB";
  };
  const usedPct = () => {
    const est = storageEstimate();
    if (est === undefined || est.usage === undefined || est.quota === undefined) {
      return undefined;
    }

    return Number(est.usage / est.quota / 100).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const intervalId = setInterval(() => reestimate(), 10000);
  onCleanup(() => clearInterval(intervalId));

  return (
    <div class={styles.Wrapper}>
      <nav class={styles.Nav}>
        <A class={styles.NavButton} classList={{[styles.NavHeader]: true}} href="/">TourForge</A>
        <div style="flex: 1"></div>
        <Show when={isPersistent() === true}>
          <div>Changes are only saved locally in your browser.</div>
        </Show>
        <Show when={isPersistent() === false || isPersistent.error}>
          <div title="You (or your browser) rejected this site's request to store data persistently.">
            Changes are only saved temporarily and will go away when your browser restarts.
          </div>
        </Show>
        <Show when={usedMB() && quotaMB() && usedPct()}>
          <div>
            Storage: {usedMB()} of {quotaMB()} used ({usedPct()})
          </div>
        </Show>
      </nav>
      <main class={styles.Main}>{props.children}</main>
    </div>
  )
}