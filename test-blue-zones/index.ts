import './style.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Deck} from '@deck.gl/core';
import {BASEMAP, vectorQuerySource, VectorTileLayer} from '@deck.gl/carto';

// Retrieve environment variables
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const accessToken = import.meta.env.VITE_API_ACCESS_TOKEN;

const connectionName = 'carto_dw';
const cartoConfig = {apiBaseUrl, accessToken, connectionName};

const INITIAL_VIEW_STATE = {
  latitude: 42.3514, 
  longitude: -83.0658, 
  zoom: 12, 
  bearing: 0,
  pitch: 0,
};

const deck = new Deck({
  canvas: 'deck-canvas',
  initialViewState: INITIAL_VIEW_STATE,
  controller: true
});

// Add basemap
const map = new maplibregl.Map({
  container: 'map',
  style: BASEMAP.VOYAGER,
  interactive: false
});

deck.setProps({
  onViewStateChange: ({viewState}) => {
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
  }
});

const versionSelector = document.getElementById('versionSelector') as HTMLSelectElement;

async function fetchVersions() {
  const query = `SELECT DISTINCT version FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\``;
  const url = `${apiBaseUrl}/v3/sql/carto_dw/query?q=${encodeURIComponent(query)}`;

  console.log('URL:', url);

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

    console.log('Response Status:', response.status);
    console.log('Response Headers:', response.headers);

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.indexOf('application/json') === -1) {
      throw new Error(`Expected JSON, but received ${contentType}`);
    }

    if (!response.ok) {
      throw new Error(`Error fetching versions: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.rows) {
      throw new Error('No data received');
    }

    console.log('Fetched versions data:', data);

    const versions = data.rows.map((row: {version: string}) => row.version).sort();
    versions.forEach((version: string) => {
      const option = document.createElement('option');
      option.value = version;
      option.text = version;
      versionSelector.appendChild(option);
    });

    console.log('Versions added to dropdown:', versions);
  } catch (error) {
    console.error('Error in fetchVersions:', error);
  }
}

function render(version: string) {
  const dataSource = vectorQuerySource({
    ...cartoConfig,
    sqlQuery: `SELECT * FROM \`carto-dw-ac-7xhfwyml.shared.ford-blue-zones\` WHERE version = @version`,
    queryParameters: {'version': version}
  });

  const layers = [
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

  deck.setProps({
    layers: layers
  });
}

versionSelector.addEventListener('change', (event) => {
  const selectedVersion = (event.target as HTMLSelectElement).value;
  render(selectedVersion);
});

// Initial render with the first version available
fetchVersions().then(() => {
  if (versionSelector.options.length > 0) {
    render(versionSelector.options[0].value);
  }
});
