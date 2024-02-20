# OpenTourBuilder

This repository holds the sourcecode for the OpenTourBuilder web application.

## Development

You'll need Python 3 and Node.js, as well as a Unix-like shell. If you're on Linux or MacOS, your default terminal is already suitable, but on Windows, make sure you use Git Bash or WSL.

Once you've cloned the repository, open a terminal inside the same directory as this README, and run the commands below:

```sh
npm install
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

(If the `python3` command isn't found, try `python` (no `3`) instead and see if that works.)

That's your initial setup. You shouldn't need to run `python -m venv .venv` again.

If the dependencies of `otb_server` (the backend) change, you'll need to run `python3 -m pip install -r requirements.txt` again. Before running any Python-related commands (pip is one of them), you always must first run `source .venv/bin/activate` at least once within the same terminal session.

If the dependencies of `otb_editor` (the frontend) change, you'll need to run `npm install` again. Since this is a Node.js-related command, running `source .venv/bin/activate` first isn't required. However, that command having been previously run doesn't harm anything.

Once the initial setup is complete, you can start up a development server by running the command `./dev.sh` in your terminal. Since `dev.sh` runs Python, you must run `source .venv/bin/activate` before running `./dev.sh` if you haven't already done so in the current terminal session. So, if you've just opened up a new terminal and want to run the development server, you'll run the following two commands:
```sh
source .venv/bin/activate
./dev.sh
```
Some IDE/code editor setups will run the `source` command for you when they detect the `.venv` directory. But others don't, so we recommend running it unless you know your IDE handles this.

Under the hood, `dev.sh` runs two commands simultaneously:
- `npm run dev`. This command runs the development server for the frontend UI of the application. The code for this part of the application is located in `otb_editor/`. This server's URL is http://127.0.0.1:3000 during development.
- `python3 manage.py runserver`. This command runs the development server for the backend API of the aplication. The code for this part of the application is located in `otb_server/`. This server's URL is http://127.0.0.1:8000 during development.

**Note that an easy mistake to make is using `localhost` instead of `127.0.0.1`. Our dev setup doesn't really work when you use `localhost`, even though the two usually have identical meaning. This could be fixed but it's not a big deal to just use `127.0.0.1`.**

To view the application's user interface, navigate to http://127.0.0.1:3000 in your browser. This is the preferred URL to use during development, because if the user interface code in `otb_editor/` is modified while you are looking at the UI, the UI will automatically update without requiring a page reload. You can also navigate to http://127.0.0.1:8000, and the UI should also display when you do this, but you will have to reload the page if you modify UI code, which can be quite annoying to do repeatedly.

This two-server setup is a bit different from production, where only one server is running. The first server (the one with the URL http://127.0.0.1:3000) is the one that does not run during production, and you can avoid running this server during development by running `dev-watch.sh` instead of `dev.sh`. There's not really any reason to do this other than for debugging issues that you think might be due to the split-server configuration. Otherwise, you'll want to use `dev.sh`, because it gives you access to the automatic UI updates described above.

## Production

Production deployment will be handled by a GitHub Action, which has yet to be configured. In production deployment, the settings files for each project are replaced by their production counterparts:
- `otb_editor/settings.ts` is replaced by `otb_editor/settings.prod.ts`
- `otb_server/settings.py` is replaced by `otb_server/settings.prod.py`.
