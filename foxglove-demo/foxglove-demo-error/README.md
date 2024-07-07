Download Foxglove Studio Destop App at https://foxglove.dev/download then follow steps below:

clone this repo
npm install
npm run local-install

open Foxglove Studio.
open a project
add a new panel, the name of the installed panel will be 'Foxglove Carto Map Panel [local]'

cant resolve these errors:
```36e624d8-04c6-428d-a672-a9db2b857b8a:4 DOMException: Failed to execute 'importScripts' on 'WorkerGlobalScope': The script at 'https://unpkg.com/@deck.gl/carto@9.0.20/dist/cartoVectorTile-worker.js' failed to load.
at blob:file:///36e624d8-04c6-428d-a672-a9db2b857b8a:2:3```

```index.cjs:452 Worker exception: Error: Failed to load worker cartovectortile (#1 of 3) from https://unpkg.com/@deck.gl/carto@9.0.20/dist/cartoVectorTile-worker.js. Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope': The script at 'https://unpkg.com/@deck.gl/carto@9.0.20/dist/cartoVectorTile-worker.js' failed to load```

```Error: Failed to load worker cartovectortile (#1 of 3) from https://unpkg.com/@deck.gl/carto@9.0.20/dist/cartoVectorTile-worker.js. Uncaught NetworkError: Failed to execute 'importScripts' on 'WorkerGlobalScope': The script at 'https://unpkg.com/@deck.gl/carto@9.0.20/dist/cartoVectorTile-worker.js' failed to load. in :5:3
at WorkerThread.\_getErrorFromErrorEvent (index.cjs:312:1)
at worker.onerror (index.cjs:328:1)```

# carto-map-panel

[Foxglove](https://foxglove.dev) allows developers to create [extensions](https://docs.foxglove.dev/docs/visualization/extensions/introduction), or custom code that is loaded and executed inside the Foxglove application. This can be used to add custom panels. Extensions are authored in TypeScript using the `@foxglove/extension` SDK.

## Develop

Extension development uses the `npm` package manager to install development dependencies and run build scripts.

To install extension dependencies, run `npm` from the root of the extension package.

```sh
npm install
```

To build and install the extension into your local Foxglove desktop app, run:

```sh
npm run local-install
```

Open the Foxglove desktop (or `ctrl-R` to refresh if it is already open). Your extension is installed and available within the app.

## Package

Extensions are packaged into `.foxe` files. These files contain the metadata (package.json) and the build code for the extension.

Before packaging, make sure to set `name`, `publisher`, `version`, and `description` fields in _package.json_. When ready to distribute the extension, run:

```sh
npm run package
```

This command will package the extension into a `.foxe` file in the local directory.

## Publish

You can publish the extension to the public registry or privately for your organization.

See documentation here: https://docs.foxglove.dev/docs/visualization/extensions/publish/#packaging-your-extension
