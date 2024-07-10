import { PanelExtensionContext } from "@foxglove/extension";
import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { fetchMap } from "@deck.gl/carto";
import { Deck, Layer } from "@deck.gl/core";
import { BASEMAP } from "@deck.gl/carto";
import maplibregl from "maplibre-gl";

function CartoMapPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const deckCanvasRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(0);
  const [selectedBasemap, setSelectedBasemap] = useState<string>(BASEMAP.VOYAGER);
  const deckRef = useRef<Deck | null>(null);

  useEffect(() => {
    const cartoMapId = "2c2ee6f1-8ef4-487f-884c-b2a56cebb3b0";

    fetchMap({ cartoMapId })
      .then(({ basemap, layers }) => {
        console.log("Basemap:", basemap);
        console.log("Layers:", layers);

        const updatedLayers = layers.map((layer) =>
          layer.clone({
            autoHighlight: false,
            highlightColor: [0, 0, 0, 0], // Transparent color
          }),
        );

        setLayers(updatedLayers);

        if (mapContainerRef.current && deckCanvasRef.current) {
          const mapContainer = mapContainerRef.current;
          const deckCanvas = deckCanvasRef.current;

          const { center = [0, 0], zoom = 1, pitch = 0, bearing = 0 } = basemap?.props || {};

          const initialViewState = {
            latitude: Array.isArray(center) ? center[1] : center.lat,
            longitude: Array.isArray(center) ? center[0] : center.lng,
            zoom,
            pitch,
            bearing,
          };

          const map = new maplibregl.Map({
            container: mapContainer,
            style: selectedBasemap,
            center: [initialViewState.longitude, initialViewState.latitude],
            zoom: initialViewState.zoom,
            pitch: initialViewState.pitch,
            bearing: initialViewState.bearing,
            interactive: true,
          });

          mapRef.current = map;

          deckRef.current = new Deck({
            canvas: deckCanvas,
            initialViewState,
            controller: true,
            layers: [updatedLayers[selectedLayerIndex] ?? updatedLayers[0]], // Default to the first layer if index is out of bounds
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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (deckRef.current) {
        deckRef.current.finalize();
        deckRef.current = null;
      }
    };
  }, [context]);

  useEffect(() => {
    if (deckRef.current && layers.length > 0) {
      const currentLayer = layers[selectedLayerIndex]?.clone({}) ?? layers[0]?.clone({});
      deckRef.current.setProps({
        layers: [currentLayer],
      });
    }
  }, [selectedLayerIndex, layers]);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(selectedBasemap);
    }
  }, [selectedBasemap]);

  const handleLayerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(event.target.value);
    if (index >= 0 && index < layers.length) {
      setSelectedLayerIndex(index);
    }
  };

  const handleBasemapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const basemap = event.target.value;
    setSelectedBasemap(basemap);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{ position: "absolute", top: 10, left: 10, zIndex: 1, display: "flex", gap: "10px" }}
      >
        <select
          onChange={handleLayerChange}
          value={selectedLayerIndex}
          style={{
            padding: "10px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            cursor: "pointer",
          }}
        >
          {layers.map((_, index) => (
            <option key={index} value={index}>
              Version {index + 1}
            </option>
          ))}
        </select>
        <select
          onChange={handleBasemapChange}
          value={selectedBasemap}
          style={{
            padding: "10px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "#fff",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            cursor: "pointer",
          }}
        >
          <option value={BASEMAP.VOYAGER}>Voyager</option>
          <option value={BASEMAP.POSITRON}>Positron</option>
          <option value={BASEMAP.DARK_MATTER}>Dark Matter</option>
        </select>
      </div>
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
