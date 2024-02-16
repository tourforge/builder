# OpenTourBuilder

This repository holds the sourcecode for the OpenTourBuilder web application.

## Development

You'll need Python 3 and Node.js. Once you've cloned the repository, open a terminal inside the same directory as this README, and run the commands below:

```sh
npm install
pip install -r requirements.txt
# ... TODO: add the rest of the commands that ar needed for initial setup
```

You can run the web application locally during development. Doing so requires running these two commands at the same time:

- Build frontend UI (otb_editor)
  ```
  # TODO: add a command here that gets Vite to watch for changes and rebuild automatically,
  #       but *not* the one that runs a dev webserver because we will be using otb_server
  #       for that (ideally)
  ```
- Run backend server (otb_server)
  ```
  python manage.py runserver
  ```

The easiest way to run them simultaneously is to open two terminal windows, because this allows you to easily stop/start them independently. In a Unix-like shell, you can also use `&`:
```
TODO-aforementioned-vite-command & python manage.py runserver &
```

Then, to stop one of them, you'll need to run `jobs`, figure out which job number has been assigned to which, and run `kill %<the job number of the one you want to stop>`.
