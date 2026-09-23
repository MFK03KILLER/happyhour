// Map tiles for every Leaflet map in the app.
//
// OpenStreetMap, served through our own caching proxy (nginx `location /tiles/`).
// CARTO's free basemaps now stamp "API KEY REQUIRED" across every tile. OSM needs
// no key, but its tile policy asks apps to identify themselves and cache - the
// proxy does both. Absolute URL so it also works in the bundled native build.
export const TILE_URL = 'https://happyhourz.org/tiles/{z}/{x}/{y}.png';

export const TILE_MAX_ZOOM = 19;

// OSM's licence requires this credit wherever the map is shown.
export const TILE_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
