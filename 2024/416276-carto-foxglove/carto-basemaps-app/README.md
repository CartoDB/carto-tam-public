# POC: Assessing water risk potential (via SQL Query + SQL Parameters)

## Technologies

### SQL Query + SQL Parameters

Using the dropdown menus, you can select different combinations to query your data using [query parameters](https://docs.carto.com/carto-for-developers/carto-for-react/guides/query-parameters)

### Boundaries

Using [tileset boundaries](https://docs.carto.com/carto-for-developers/guides/use-boundaries-in-your-application) geometries and data are separated to increase performance and efficiency of the map.

### Server

Uses [Vite](https://vitejs.dev/) to bundle and serve files.

## Usage

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/CartoDB/carto-tam-public/tree/master/2024/383294-wri-map-migration/sample-boundary?file=index.ts)

Or run it locally:

```bash
npm install
# or
yarn
```

Commands:

- `npm run dev` is the development target, to serve the app and hot reload.
- `npm run build` is the production target, to create the final bundle and write to disk.
