import Modal from "components/Modal";
import Head from "next/head";
import Link from "next/link";
import { ChangeEvent, useEffect, useId, useState } from "react";
import { createProject, listProjects, openProject } from "src/api";

import styles from "../styles/Home.module.css";

export default function Home() {
  const id = useId();
  const [projects, setProjects] = useState<string[]>();
  const [newProjectName, setNewProjectName] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    listProjects().then(projects => setProjects(projects)).catch(console.error);
  }, []);

  function handleCreateProjectClick() {
    setNewProjectName("");
  }

  function handleModalCancelClick() {
    setNewProjectName(undefined);
    setError(undefined);
  }

  function handleModalCreateClick() {
    if (newProjectName && !error) {
      createProject(newProjectName);
    }
  }

  function handleProjectNameChange(ev: ChangeEvent<HTMLInputElement>) {
    setNewProjectName(ev.target.value);
    
    if (!ev.target.value.trim()) {
      setError("Project name must not be empty");
      return;
    }

    if (projects?.findIndex(prj => prj.toLowerCase() === ev.target.value.toLowerCase()) != -1) {
      setError("Project name already used");
      return;
    }

    if (/[^a-zA-Z0-9\-]/.test(ev.target.value)) {
      setError("Project name can only contain alphanumeric characters or dashes");
      return;
    }

    setError(undefined);
  }

  async function handleProjectClick(project: string) {
    openProject(project);
  }

  return (
    <>
      <Head>
        <title>OpenTourBuilder</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.Home}>
        <header>OpenTourBuilder Projects</header>
        <div className={styles.createProject}>
          <button className="primary" onClick={handleCreateProjectClick}>Create Project</button>
        </div>
        <div className={styles.projects}>
          {projects?.map(project => (
            <button className={styles.projectButton} key={project} onClick={() => handleProjectClick(project)}>
              {project}
            </button>
          ))}
        </div>
      </div>
      <Modal isOpen={typeof newProjectName != "undefined"}>
        <header>Creating project</header>
        Please choose a name for your project:
        <div className="column">
          <label className="inline-label" htmlFor={id}>Project Name</label>
          <input type="text" name="Project Name" onChange={handleProjectNameChange} />
        </div>
        {error ? <div style={{color: "red"}}>Error: {error}</div> : <></>}
        <div style={{display: "flex", justifyContent: "flex-end", gap: "16px"}}>
          <button className="secondary" onClick={handleModalCancelClick}>Cancel</button>
          <button className="primary" onClick={handleModalCreateClick}>Create</button>
        </div>
      </Modal>
    </>
  );
}
