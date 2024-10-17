# TourForge

[Open in your browser](https://tourforge.github.io/builder)

This repository holds the sourcecode for the TourForge web application.

## Development

1. Install Node.js.
2. Perform initial setup:
   ```sh
   npm install
   ```
3. Run the development web server:
   ```sh
   npm run dev
   ```

## History
TourForge went through many changes during development. For those who are interested, below is a rough outline of the different stages.

1. Web app with Go backend and TypeScript/React frontend. Not too much time was spent on this iteration; it never became feature-complete.
2. Flutter desktop app. Lots of time was spent here, and this iteration eventually became feature-complete. A desktop app seemed likely to be the most low-maintenance option, and the mobile app was already being developed with Flutter, so it made sense to try the same framework for the desktop app.
3. Desktop app with Rust backend (Tauri) and TypeScript/React frontend. This was a full rewrite done to get away from the "jank" of Flutter desktop at the time. This version eventually became feature-complete.
4. Web app with Python/Django backend and TypeScript/Solid frontend. Frontend was switched from React to Solid to force a full pass over the UI code to fix some problems it had; since React and Solid are very similar, this was not a "full rewrite," but maybe a 50% rewrite. The switch from desktop to web was done with the goal of making TourForge easier for people to use, becoming a more all-encompassing solution for both building tours and acting as a tour content server. Though an official release was never made, this version was feature-complete by the time we moved on to stage 5.
5. (Now!) Web app with **NO** backend and TypeScript/Solid frontend. There were challenges in finding cloud hosting for the Django backend with all of the features we needed for maximum maintainability. Actually, this result was already forseen back when we chose to write a desktop app in stage 2 -- but something caused us to forget this and make a web app anyways in stage 4. In any case, we decided to simply get rid of the backend and keep the same frontend but have it interface with IndexedDB. It would have been an equal amount of work to go back to being a desktop app, but we think a fully client-side web app might be close to having the best of both worlds.

## User script
There are a few issues we have encountered with the creation of tour bundle, it works well as expected, but there were problems we had to solve with scripting. You can find all script named after its function in `user-script/` at the root of the builder repository.

### Image assets are too heavy
We were receiving full resolution images sometimes upward of 32MB and did not have formal procedure in place to make sure that the image is appropriately sized. With how small smartphone screen are, even a small picture in the low end of hundreds of KB is plenty enough to not be discernable. Downsizing assets reduces overhead and bandwidth for each download of the tour bundle. The script only resize 1 time so you should just keep running until all files are under a certain limit. You are welcome to rewrite the script to run in a conditional loop and contribute.

Non-nix users should rewrite the first 2 lines of shebang to simply `#! /usr/bin/env bash` and acquire the necessary prerequisite program (they are listed at the second line of original shebang, not that these are canonical program name, the exact package name in your distribution's repository may varies).

### Audio assets playback not working in iOS
The problem was that the backend audio library requires an appropriate filename e.g. ".mp3". The script renames all the audio file with the extension and modify the JSON to the new filename. 