import './style.css';
import { GoogleMapsOverlay as DeckOverlay } from '@deck.gl/google-maps';
import { VectorTileLayer, vectorQuerySource } from '@deck.gl/carto';
import { Loader } from '@googlemaps/js-api-loader';
import config from './config.json'; // Import the configuration file

const GOOGLE_MAPS_API_KEY = config.googleMapsApiKey;
const apiBaseUrl = config.apiBaseUrl;
const accessToken = config.accessToken;
const connectionName = 'carto_dw';
const cartoConfig = { apiBaseUrl, accessToken, connectionName };

const INITIAL_VIEW_STATE = {
  latitude: 42.3514,
  longitude: -83.0658,
  zoom: 12,
  bearing: 0,
  pitch: 0,
};

let map: google.maps.Map;
let deckOverlay: DeckOverlay;
let layers: VectorTileLayer[];

function setBasemap(mapTypeId: string, mapId: string) {
  const center = map ? map.getCenter() : { lat: INITIAL_VIEW_STATE.latitude, lng: INITIAL_VIEW_STATE.longitude };
  const zoom = map ? map.getZoom() : INITIAL_VIEW_STATE.zoom;

  if (deckOverlay) {
    deckOverlay.setMap(null);
  }

  document.getElementById('map')!.innerHTML = ''; // Clear the map container

  map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
    center,
    zoom,
    mapId,
    mapTypeId,
    mapTypeControl: false,
    streetViewControl: false,
    disableDefaultUI: true,
    tilt: 45 // Ensure tilt is set for 3D buildings
  });

  deckOverlay = new DeckOverlay({
    layers: layers || []
  });

  deckOverlay.setMap(map);
}

async function fetchVersions() {
  const query = `SELECT DISTINCT version FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\``;
  const url = `${apiBaseUrl}/v3/sql/carto_dw/query?q=${encodeURIComponent(query)}`;

  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${accessToken}`);
  myHeaders.append("Cache-Control", "max-age=300");

  const requestOptions: RequestInit = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow'
  };

  try {
    const response = await fetch(url, requestOptions);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') === -1) {
      const text = await response.text();
      throw new Error(`Expected JSON, but received ${contentType}`);
    }

    if (!response.ok) {
      throw new Error(`Error fetching versions: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.rows) {
      throw new Error('No data received');
    }

    const versions = data.rows.map((row: { version: string }) => row.version).sort();
    const versionSelector = document.getElementById('versionSelector') as HTMLSelectElement;
    versions.forEach((version: string) => {
      const option = document.createElement('option');
      option.value = version;
      option.text = version;
      versionSelector.appendChild(option);
    });

    // Initialize the map with the first version
    if (versions.length > 0) {
      render(versions[0]);
    }
  } catch (error) {
    console.error('Error in fetchVersions:', error);
  }
}

function render(version: string) {
  const dataSource = vectorQuerySource({
    ...cartoConfig,
    sqlQuery: `SELECT * FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\` WHERE version = @version`,
    queryParameters: { 'version': version }
  });

  layers = [
    new VectorTileLayer({
      id: 'ford-blue-zones',
      data: dataSource,
      pickable: true,
      opacity: 0.3,
      getFillColor: [0, 0, 255, 77],
      getLineColor: [0, 0, 255],
      lineWidthMinPixels: 2
    }),
  ];

  if (deckOverlay) {
    deckOverlay.setProps({ layers });
  }
}

document.getElementById('versionSelector')!.addEventListener('change', (event) => {
  const selectedVersion = (event.target as HTMLSelectElement).value;
  render(selectedVersion);
});

document.getElementById('basemapSelector')!.addEventListener('change', (event) => {
  const selectedBasemap = (event.target as HTMLSelectElement).value;
  const [mapTypeId, mapId] = selectedBasemap.split('.');
  setBasemap(mapTypeId, mapId);

  const versionSelector = document.getElementById('versionSelector') as HTMLSelectElement;
  if (versionSelector && versionSelector.value) {
    render(versionSelector.value);
  }
});

const loader = new Loader({
  apiKey: GOOGLE_MAPS_API_KEY,
  version: 'weekly'
});

loader.load().then(async () => {
  setBasemap('roadmap', '3754c817b510f791'); // Default to Google Roadmap
  fetchVersions();
});
