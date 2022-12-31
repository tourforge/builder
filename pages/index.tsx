import { useEffect, useRef } from "react";
import { RecoilRoot } from "recoil";

import Head from "next/head";

import Modal from "react-modal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { LatLng } from "../src/data";

import Map from "../components/map";
import Sidebar from "../components/sidebar";

import styles from "../styles/Home.module.css";

export default function Home() {
  const mapCenter = useRef<LatLng>({ "lat": 0, "lng": 0 });

  useEffect(() => {
    Modal.setAppElement(document.getElementById("__next")!);
  }, []);

  return (
    <RecoilRoot>
      <Head>
        <title>OpenTourBuilder</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <Sidebar mapCenter={mapCenter} />
        <Map centerRef={mapCenter} />
      </main>
      <ToastContainer
        position="bottom-left"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </RecoilRoot>
  );
}
