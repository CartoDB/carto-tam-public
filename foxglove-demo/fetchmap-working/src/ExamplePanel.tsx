import { PanelExtensionContext } from "@foxglove/extension";
import { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { fetchMap } from "@deck.gl/carto";
import { Deck } from "@deck.gl/core";
import { BASEMAP } from "@deck.gl/carto";
import maplibregl from "maplibre-gl";

function CartoMapPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const deckCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cartoMapId = "b290ab8d-90cd-443d-9f8e-04db131351a6";

    fetchMap({ cartoMapId })
      .then(({ basemap, layers }) => {
        console.log("Basemap:", basemap);
        console.log("Layers:", layers);

        if (mapContainerRef.current && deckCanvasRef.current) {
          const mapContainer = mapContainerRef.current;
          const deckCanvas = deckCanvasRef.current;

          const center = basemap?.props.center;
          let latitude: number;
          let longitude: number;

          if (Array.isArray(center)) {
            longitude = center[0];
            latitude = center[1];
          } else if (center && typeof center === "object") {
            longitude = center.lng;
            latitude = center.lat;
          } else {
            longitude = 0;
            latitude = 0;
          }

          const initialViewState = {
            latitude,
            longitude,
            zoom: basemap?.props.zoom ?? 1,
            pitch: basemap?.props.pitch ?? 0,
            bearing: basemap?.props.bearing ?? 0,
          };

          const map = new maplibregl.Map({
            container: mapContainer,
            style: BASEMAP.VOYAGER,
            center: [longitude, latitude],
            zoom: initialViewState.zoom,
            pitch: initialViewState.pitch,
            bearing: initialViewState.bearing,
            interactive: false,
          });

          new Deck({
            canvas: deckCanvas,
            initialViewState,
            controller: true,
            layers,
            onViewStateChange: ({ viewState }) => {
              const { longitude, latitude, ...rest } = viewState;
              map.jumpTo({ center: [longitude, latitude], ...rest });
            },
          });

          map.on("load", () => {
            console.log("Map loaded");
          });
        } else {
          console.error("Map container or Deck.gl canvas is missing");
        }
      })
      .catch((error) => {
        console.error("Error fetching map:", error);
      });

    context.onRender = (_, done) => {
      done();
    };

    context.watch("topics");
    context.watch("currentFrame");
    context.subscribe([{ topic: "/some/topic" }]);
  }, [context]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={mapContainerRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
      <canvas ref={deckCanvasRef} style={{ position: "absolute", width: "100%", height: "100%" }} />
    </div>
  );
}

export function initExamplePanel(context: PanelExtensionContext): () => void {
  ReactDOM.render(<CartoMapPanel context={context} />, context.panelElement);

  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
