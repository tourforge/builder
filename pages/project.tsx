import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { FaRegFile, FaMapSigns, FaPlus, FaEllipsisV, FaTrash } from "react-icons/fa";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createTour, deleteTour, getTour, listTours, putTour } from "src/api";
import { TourModel } from "src/data";

import TourEditor from "../components/tour-editor/tour-editor";

import styles from "../styles/Project.module.css";

export default function Project() {
  const [tourId, setTourId] = useState<string | undefined>();
  const [tour, setTour] = useState<TourModel | undefined>();
  const [tourWritten, setTourWritten] = useState({});
  const tourIdRef = useRef<string | undefined>();
  const tourRef = useRef<TourModel | undefined>();
  tourIdRef.current = tourId;
  tourRef.current = tour;

  useEffect(() => {
    let prevTourRefCurrent = tourRef.current;
    const timer = setInterval(async () => {
      if (tourRef.current !== prevTourRefCurrent) {
        prevTourRefCurrent = tourRef.current;

        if (tourIdRef.current && tourRef.current) {
          await putTour(tourIdRef.current!, tourRef.current!);
          setTourWritten({});
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Head>
        <title>OpenTourBuilder</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.Project}>
        <ProjectSidebar tourWritten={tourWritten} tourId={tourId} setTourId={setTourId} setTour={setTour} />
        {tour ? <TourEditor tour={tour} setTour={setTour as any} /> : <></>}
      </div>
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
    </>
  );
}

function ProjectSidebar({ tourWritten, tourId, setTourId, setTour }: {
  tourWritten: {},
  tourId: string | undefined,
  setTourId: (tourId: string | undefined) => void,
  setTour: (tour: TourModel | undefined) => void
}) {
  const [toursChanged, setToursChanged] = useState({});
  const [toursList, setToursList] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    listTours().then(tours => setToursList(tours)).catch(console.error);
  }, [toursChanged]);

  useEffect(() => {
    listTours().then(tours => setToursList(tours)).catch(console.error);
  }, [tourWritten]);

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
      const content = await getTour(id);
      setTourId(id);
      setTour(content);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTourDeleteClick(id: string) {
    try {
      await deleteTour(id);
      if (id === tourId) {
        setTourId(undefined);
        setTour(undefined);
      }
      setToursChanged({});
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className={styles.ProjectSidebar}>
      <button><FaRegFile /> Assets</button>
      <header>Tours</header>
      {toursList.map(tour => (
        <div className={styles.dualButton} key={tour.id}>
          <button style={{flex: 1}} onClick={() => handleTourClick(tour.id)}><FaMapSigns /> {tour.name}</button>
          <button onClick={() => handleTourDeleteClick(tour.id)}><FaTrash /></button>
        </div>
      ))}
      <button onClick={handleAddTourClick}><FaPlus /> Add Tour</button>
    </div>
  );
}
