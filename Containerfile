# ======= Build stage =======
FROM node:latest as builder

WORKDIR /code

COPY package*.json .
RUN npm ci

COPY otb_editor otb_editor
COPY index.html index.html
COPY tsconfig.json tsconfig.json
COPY vite.config.ts vite.config.ts
RUN mv otb_editor/settings.prod.ts otb_editor/settings.ts

RUN npm run build


# ====== Runtime stage ======
FROM alpine:3.19

# system dependencies
RUN apk add --no-cache python3 py3-pip bash

# set up venv so we can use pip to install python deps (without this we can't)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# install python deps
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# only copy exactly what we need at runtime
WORKDIR /code
COPY --from=builder /code/dist dist
COPY manage.py manage.py
COPY otb_server otb_server
RUN mv otb_server/settings.prod.py otb_server/settings.py

# these vars are used in settings.py, but their values don't matter for collectstatic
ENV SECRET_KEY=""
ENV DJANGO_HOST=""
ENV DB_PATH=""

# run ./manage.py collectstatic so that whitenoise can find the static html/js/css
RUN mkdir staticfiles
RUN ./manage.py collectstatic

# need for running prod.sh and gunicorn
COPY prod.sh prod.sh
COPY config config

EXPOSE 8000

ENTRYPOINT ["bash"]
CMD ["prod.sh"]
