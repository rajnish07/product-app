# product-app

Simple Node.js application packaged with Docker. The app listens on port 3000 and the main code is inside the `app/` folder (including `index.js` and `package.json`).

## Prerequisites

- Docker installed and running
- Project root contains `Dockerfile` and the `app/` directory

## Build the image

From the project root run:

    docker build -t product-app:dev .

## Run the container

Run the container and map port 3000:

    docker run --rm -p 3000:3000 product-app:dev

Open http://localhost:3000 in your browser.

## Run locally (without Docker)

From project root:

    cd product-app
    npm install
    node app/index.js

## Folder layout

- app/
  - index.js
  - ...other app files...
- package.json
- Dockerfile
- README.md

## Notes

- If you change source files, rebuild the Docker image.
- If the container fails to start, check logs with `docker logs <container-id>` and verify Docker daemon is running.
