import './style.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {Deck} from '@deck.gl/core';
import {BASEMAP, boundaryQuerySource, VectorTileLayer} from '@deck.gl/carto';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const accessToken = import.meta.env.VITE_API_ACCESS_TOKEN;
const connectionName = 'carto_dw';
const cartoConfig = {apiBaseUrl, accessToken, connectionName};

const INITIAL_VIEW_STATE = {
  latitude: 41.8097343,
  longitude: -110.5556199,
  zoom: 3,
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
  style: BASEMAP.POSITRON,
  interactive: false
});

deck.setProps({
  onViewStateChange: ({viewState}) => {
    const {longitude, latitude, ...rest} = viewState;
    map.jumpTo({center: [longitude, latitude], ...rest});
  }
});

let selectedYear = 2020;
const selectedYearSelector = document.querySelector<HTMLSelectElement>('#yearSelector');
selectedYearSelector?.addEventListener('change', () => {
  selectedYear = Number(selectedYearSelector.value);
  render();
});

let selectedScenario = 'business_as_usual';
const selectedScenarioSelector = document.querySelector<HTMLSelectElement>('#scenarioSelector');
selectedScenarioSelector?.addEventListener('change', () => {
  selectedScenario = selectedScenarioSelector.value;
  render();
});

function render() {
  const projectedWaterStress = boundaryQuerySource({
    ...cartoConfig,
    tilesetTableName: 
      'carto-dw-ac-3nduqebh.shared.aqueduct_projections_20150309_geom_split_tileset_0_12',
    propertiesSqlQuery: 
      `SELECT
        label,
        CAST(basinid AS STRING) AS geoid
      FROM
        \`carto-dw-ac-3nduqebh.shared.water_risk_indicators_projections\`
      WHERE 
        year = @selectedYear
        AND type = 'future_value'
        AND indicator = 'water_stress'
        AND scenario = @selectedScenario
        AND label IS NOT NULL`,
    matchingColumn: 
      'geoid',
    queryParameters: {
      'selectedYear' : selectedYear,
      'selectedScenario' : selectedScenario
    },
  });

  const layers = [
    new VectorTileLayer({
      id: 'projected-water-stress',
      data: projectedWaterStress,
      pickable: true,
      opacity: 0.8,
      getFillColor: (d) => {
        const label = d.properties.label;
        if (label === 'No data') {
          return [78,78,78];
        } else if (label === 'Arid and low water use') {
          return [128,128,128];
        } else if (label === 'Low (<10%)') {
          return [255,255,153];
        } else if (label === 'Low-medium (10-20%)') {
          return [255,230,0];
        } else if (label === 'Medium-high (20-40%)') {
          return [255,153,0];
        } else if (label === 'High (40-80%)') {
          return [255,25,0];
        } else if (label === 'Extremely high (>80%)') {
          return [153,0,0];
        } else {
          return [220,220,220];
        }
      },      
    }),
  ];

  deck.setProps({
    layers: layers
  });
}

render();