import AssetsEditor from "components/assets-editor";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { FaRegFile, FaMapSigns, FaPlus, FaTrash, FaCog, FaFileExport } from "react-icons/fa";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import * as polyline from "src/polyline";
import { createTour, deleteTour, exportProject, getTour, listTours, putTour, route } from "src/api";
import { TourModel } from "src/data";
import { SetterOrUpdater, callIfUpdater, setterOrUpdater } from "src/state";

import TourEditor from "../components/tour-editor";

import styles from "../styles/Project.module.css";
import { TourDb } from "src/tour-db";

type EditorScreen = {
  screen: "home"
} | {
  screen: "tour",
  tour: TourModel,
  db: TourDb,
} | {
  screen: "assets"
};

export default function Project() {
  const [screen, setScreen] = useState<EditorScreen>({ screen: "home" });
  const screenRef = useRef<EditorScreen>(screen);
  screenRef.current = screen;

  let editor;
  switch (screen.screen) {
    case "home":
      editor = null;
      break;
    case "assets":
      editor = <AssetsEditor />;
      break;
    case "tour":
      editor = <TourEditor
        tour={screen.tour}
        setTour={v => {
          const currentScreen = screenRef.current;
          if (currentScreen.screen !== "tour") return;

          const newTour = callIfUpdater(currentScreen.tour, v);

          screen.db.set(newTour);
          setScreen({ ...currentScreen, tour: newTour });
        }}
      />;
      break;
  }

  return (
    <>
      <Head>
        <title>OpenTourBuilder</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.Project}>
        <ProjectSidebar screen={screen} setScreen={setScreen} />
        {editor}
      </div>
      <ToastContainer
        position="bottom-right"
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
    </>
  );
}

function ProjectSidebar({ screen, setScreen }: {
  screen: EditorScreen,
  setScreen: SetterOrUpdater<EditorScreen>,
}) {
  const [toursChanged, setToursChanged] = useState({});
  const [toursList, setToursList] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    listTours().then(tours => setToursList(tours)).catch(console.error);
  }, [toursChanged]);

  function handleAssetsClick() {
    setScreen({ screen: "assets" });
  }

  async function handleAddTourClick() {
    try {
      await createTour({
        name: "Untitled",
        desc: "",
        waypoints: [],
        gallery: [],
        path: "",
        pois: [],
        tiles: undefined,
      });
      setToursChanged({});
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTourClick(id: string) {
    try {
      const db = new TourDb(id, { onSave: () => setToursChanged({}) });

      setScreen({
        screen: "tour",
        db,
        tour: await db.load(),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTourDeleteClick(id: string) {
    try {
      await deleteTour(id);
      setScreen({ screen: "home" });
      setToursChanged({});
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles.ProjectSidebar}>
      <button className={styles.ProjectSidebarButton} onClick={handleAssetsClick}>
        <FaRegFile /> Assets
      </button>
      <header>Tours</header>
      {toursList.map(tour => (
        <div className={styles.dualButton} key={tour.id}>
          <button className={styles.ProjectSidebarButton} style={{ flex: 1 }} onClick={() => handleTourClick(tour.id)}><FaMapSigns /> {tour.name}</button>
          <button className={styles.ProjectSidebarButton} onClick={() => handleTourDeleteClick(tour.id)}><FaTrash /></button>
        </div>
      ))}
      <button className={styles.ProjectSidebarButton} onClick={handleAddTourClick}><FaPlus /> Add Tour</button>
      <div style={{ flex: 1 }}></div>
      <ProjectButtons />
    </div>
  );
}

function ProjectButtons() {
  function handleExport() {
    toast.promise(
      exportProject(),
      {
        pending: "Exporting tour...",
        success: "Tour successfully exported!",
        error: "Failed to export tour!"
      }
    );
  }

  return (
    <div className={styles.ProjectButtons}>
      <button className="primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleExport}><FaFileExport /> Export</button>
      <button className="secondary" style={{ flex: 1, justifyContent: "center" }}><FaCog /> Settings</button>
    </div>
  );
}
