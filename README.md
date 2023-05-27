# OpenTourBuilder

This repository holds the source code for the part of OpenTourBuilder that lets you build custom
tours on a desktop computer.

## Development

You'll need two things to run OpenTourBuilder as a developer: a built dynamic library of
[Lotyr](https://github.com/opentourbuilder/lotyr) for your platform and a `valhalla_tiles.tar` file.
These two files are what allows OpenTourBuilder to calculate route instructions between the stops
added along each tour. If both of these files are not in place, then the application will not be
able to generate routes and therefore will not be fully functional.

Once you've acquired these two files, create two new directories: `src-tauri/dev-install/` and
within that one, `src-tauri/dev-install/lotyr`. Place the Lotyr library and the `valhalla_tiles.tar`
files inside this directory. Assuming you didn't change the names of these files, you should be
good to go!

## Overall architecture

The front-end of the application is built with [Next.js](https://nextjs.org/), which is a framework
built around [React](https://reactjs.org/). These are technologies that only work to build web apps,
so we use [Tauri](https://tauri.app/) as our framework for running the application on desktop.
Tauri application backends are written in [Rust](https://www.rust-lang.org/); you can find the
backend of this application in the `src-tauri/` subdirectory.

### Front-end architecture

The architecture of the front-end is very simple: it stores the tours in-memory as a regular JS
object using React Hooks to manage the state. Importantly, the tour object is never modified;
instead, it is only ever replaced with a new object containing the updated state. This is following
the typcial guidelines for using React Hooks. In order to persist tours to disk and perform other
actions that interact with the OS, the front-end calls the backend over the interface provided by
Tauri. Tours in particular are automatically saved to disk every second if they have been modified.


### Backend architecture

The backend is arguable simpler than the front-end. It holds no state and provides some minimal
abstractions around creating, reading, updating, and deleting tours and projects and assets.

## Local Deployment Guide

This guide provides step-by-step instructions for deploying a containerized web application locally using the provided Docker image.

### Prerequisites

- Docker installed on your local machine. If Docker is not installed, please refer to the official [Docker installation guide](https://docs.docker.com/get-docker/) for instructions specific to your operating system.

### Deployment Steps

1. **Pull the Docker Image**

   Open a terminal or command prompt and execute the following command to pull the Docker image from the container registry:

   ```shell
   docker pull your-image-name:tag
   ```

   Replace `your-image-name` with the name of your Docker image and `tag` with the desired version or tag of the image.

2. **Run the Docker Container**

   Once the Docker image is downloaded, you can run it as a container using the following command:

   ```shell
   docker run -d -p 8080:80 --name your-container-name your-image-name:tag
   ```

   This command starts a container in the background (`-d`) and maps port 8080 of the host to port 80 of the container (`-p 8080:80`). Replace `your-container-name` with a meaningful name for your container.

3. **Access the Web Application**

   The containerized web application should now be running locally. You can access it by opening a web browser and entering `http://localhost:8080` in the address bar.

For more information about Docker and managing containers, please refer to the [Docker documentation](https://docs.docker.com/).

## Production Deployment Guide

This guide provides step-by-step instructions for deploying a containerized web application to any production environment using the provided Docker image.

### Prerequisites

- Docker installed on the production environment. If Docker is not installed, please refer to the official [Docker installation guide](https://docs.docker.com/get-docker/) for instructions specific to your operating system.

### Deployment Steps

1. **Pull the Docker Image**

   Open a terminal or command prompt on the production environment and execute the following command to pull the Docker image from the container registry:

   ```shell
   docker pull your-image-name:tag
   ```

   Replace `your-image-name` with the name of your Docker image and `tag` with the desired version or tag of the image.

2. **Run the Docker Container**

   Once the Docker image is downloaded, you can run it as a container using the following command:

   ```shell
   docker run -d -p 80:80 --name your-container-name your-image-name:tag
   ```

   This command starts a container in the background (`-d`) and maps port 80 of the host to port 80 of the container (`-p 80:80`). Replace `your-container-name` with a meaningful name for your container.

3. **Access the Web Application**

   The containerized web application should now be running. You can access it by opening a web browser and entering the IP address or domain name of the production environment.

For more information about Docker and managing containers, please refer to the [Docker documentation](https://docs.docker.com/).