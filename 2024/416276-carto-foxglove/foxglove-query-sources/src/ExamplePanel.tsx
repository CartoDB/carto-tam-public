import { PanelExtensionContext } from "@foxglove/extension";
import "./style.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Deck } from "@deck.gl/core";
import { BASEMAP, vectorQuerySource, VectorTileLayer } from "@deck.gl/carto";

const apiBaseUrl = "https://gcp-us-east1.api.carto.com";
const accessToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJhIjoiYWNfN3hoZnd5bWwiLCJqdGkiOiI5MzAzYmQxNCJ9.fF6vEZ9_QaRAWxbapR4DtJ6zIOTiHOiuTE8g95DKtmQ";
const connectionName = "carto_dw";
const cartoConfig = { apiBaseUrl, accessToken, connectionName };

const INITIAL_VIEW_STATE = {
  latitude: 42.3514,
  longitude: -83.0658,
  zoom: 12,
  bearing: 0,
  pitch: 0,
};

async function fetchVersions(versionSelector: HTMLSelectElement) {
  const query = `SELECT DISTINCT version FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\``;
  const url = `${apiBaseUrl}/v3/sql/carto_dw/query?q=${encodeURIComponent(query)}`;

  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${accessToken}`);
  myHeaders.append("Cache-Control", "max-age=300");

  const requestOptions: RequestInit = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`Error fetching versions: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.rows) {
      throw new Error("No data received");
    }

    const versions = data.rows.map((row: { version: string }) => row.version).sort();
    versions.forEach((version: string) => {
      const option = document.createElement("option");
      option.value = version;
      option.text = version;
      versionSelector.appendChild(option);
    });

    if (versions.length > 0) {
      return versions[0];
    }
  } catch (error) {
    console.error("Error in fetchVersions:", error);
  }
  return null;
}

async function render(version: string, deck: Deck, cartoConfig: any) {
  const dataSource = vectorQuerySource({
    ...cartoConfig,
    sqlQuery: `SELECT * FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\` WHERE version = @version`,
    queryParameters: { version: version },
  });

  try {
    const response = await dataSource;
    console.log("Data fetched for version:", version, response);

    const layers = [
      new VectorTileLayer({
        id: "ford-blue-zones",
        data: dataSource,
        pickable: true,
        opacity: 0.3,
        getFillColor: [0, 0, 255, 77],
        getLineColor: [0, 0, 255],
        lineWidthMinPixels: 2,
        loadOptions: { worker: false },
      }),
    ];

    console.log("Layers set for Deck:", layers);
    deck.setProps({ layers });
  } catch (error) {
    console.error("Error in rendering layers:", error);
  }
}

function CartoMapPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const deckCanvasRef = useRef<HTMLCanvasElement>(null);
  const versionSelectorRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && deckCanvasRef.current && versionSelectorRef.current) {
      const mapContainer = mapContainerRef.current;
      const deckCanvas = deckCanvasRef.current;
      const versionSelector = versionSelectorRef.current;

      const deck = new Deck({
        canvas: deckCanvas,
        initialViewState: INITIAL_VIEW_STATE,
        controller: true,
      });

      const map = new maplibregl.Map({
        container: mapContainer,
        style: BASEMAP.VOYAGER,
        center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
        zoom: INITIAL_VIEW_STATE.zoom,
      });

      deck.setProps({
        onViewStateChange: ({ viewState }) => {
          map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch,
          });
        },
      });

      map.on("move", () => {
        const { lng, lat } = map.getCenter();
        deck.setProps({
          viewState: {
            longitude: lng,
            latitude: lat,
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch(),
            transitionDuration: 0,
          },
        });
      });

      versionSelector.addEventListener("change", (event) => {
        const selectedVersion = (event.target as HTMLSelectElement).value;
        render(selectedVersion, deck, cartoConfig);
      });

      fetchVersions(versionSelector).then((initialVersion) => {
        if (initialVersion) {
          render(initialVersion, deck, cartoConfig);
        }
      });

      context.onRender = (_, done) => {
        done();
      };

      context.watch("topics");
      context.watch("currentFrame");
      context.subscribe([{ topic: "/some/topic" }]);
    } else {
      console.error("Map container, Deck.gl canvas, or version selector is missing");
    }
  }, [context]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        ref={mapContainerRef}
        id="map"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <canvas
        ref={deckCanvasRef}
        id="deck-canvas"
        style={{ position: "absolute", width: "100%", height: "100%" }}
      />
      <select
        ref={versionSelectorRef}
        id="versionSelector"
        style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1000 }}
      ></select>
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): void {
  ReactDOM.render(<CartoMapPanel context={context} />, context.panelElement);
}
