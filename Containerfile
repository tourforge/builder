FROM alpine:3.19

ARG SECRET_KEY
ARG DJANGO_HOST
ARG DJANGO_SUPERUSER_PASSWORD

# system dependencies
RUN apk add --no-cache nodejs-current npm python3 py3-pip

# set up venv so we can use pip to install python deps (without this we can't)
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# install python deps
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# copy the code and cd to it
COPY . code
WORKDIR /code

# replace each settings file with prod settings
RUN mv otb_server/settings.prod.py otb_server/settings.py
RUN mv otb_editor/settings.prod.ts otb_editor/settings.ts

# install js deps and then build the frontend
# note: technically there's no need to have nodejs and npm inside the container and this step
# could be done outside the container, but this method is easier for now (and maybe forever!).
RUN npm install
RUN npm run build

# create env var for each arg
ENV SECRET_KEY=$SECRET_KEY
ENV DJANGO_HOST=$DJANGO_HOST
ENV DJANGO_SUPERUSER_PASSWORD=$DJANGO_SUPERUSER_PASSWORD

# it is required to run ./manage.py collectstatic so that whitenoise can find the static html/js/css.
RUN mkdir staticfiles
RUN ./manage.py collectstatic

# to create the database we need to run the migrations.
RUN ./manage.py migrate

# make a superuser for the Django admin panel.
RUN ./manage.py createsuperuser --username admin --email admin@example.org --noinput

EXPOSE 8000

ENTRYPOINT ["gunicorn"]
CMD ["-c", "config/gunicorn/prod.py"]