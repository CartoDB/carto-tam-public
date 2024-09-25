import { PanelExtensionContext } from "@foxglove/extension";
import "./style.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Deck } from "@deck.gl/core";
import { BASEMAP, vectorQuerySource, VectorTileLayer } from "@deck.gl/carto";

const apiBaseUrl = "https://gcp-us-east1.api.carto.com"; // Update with your API base URL
const accessToken =
  "your-access-token"; // Update with your access token
const connectionName = "carto_dw";
const cartoConfig = { apiBaseUrl, accessToken, connectionName };

const INITIAL_VIEW_STATE = {
  latitude: 42.3514,
  longitude: -83.0658,
  zoom: 12,
  bearing: 0,
  pitch: 0,
};

function render(deck: Deck, cartoConfig: any) {
  const dataSource = vectorQuerySource({
    ...cartoConfig,
    sqlQuery: `SELECT * FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\``, // Update with your SQL query
  });

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

  deck.setProps({ layers });
}

function CartoMapPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const deckCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && deckCanvasRef.current) {
      const mapContainer = mapContainerRef.current;
      const deckCanvas = deckCanvasRef.current;

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

      render(deck, cartoConfig);

      context.onRender = (_, done) => {
        done();
      };

      context.watch("topics");
      context.watch("currentFrame");
      context.subscribe([{ topic: "/some/topic" }]);
    } else {
      console.error("Map container or Deck.gl canvas is missing");
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
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): void {
  ReactDOM.render(<CartoMapPanel context={context} />, context.panelElement);
}
