import { ref } from 'vue';

const coords = ref(null);
const status = ref('idle');
const error = ref(null);
const cachedAt = ref(null);

const STORAGE_KEY = 'hh_geo_cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.cachedAt > CACHE_TTL_MS) return null;
    return obj;
  } catch { return null; }
}

function saveCache(c) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function useGeolocation() {
  async function request() {
    const cached = loadCache();
    if (cached) {
      coords.value = { lat: cached.lat, lng: cached.lng };
      cachedAt.value = cached.cachedAt;
      status.value = 'granted';
      return coords.value;
    }
    if (!('geolocation' in navigator)) {
      status.value = 'unsupported';
      error.value = 'Geolocation not supported on this device.';
      return null;
    }
    status.value = 'requesting';
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          coords.value = c;
          cachedAt.value = Date.now();
          status.value = 'granted';
          error.value = null;
          saveCache({ ...c, cachedAt: cachedAt.value });
          resolve(c);
        },
        (err) => {
          status.value = err.code === 1 ? 'denied' : 'error';
          error.value = err.message;
          resolve(null);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  function clearCache() {
    localStorage.removeItem(STORAGE_KEY);
    coords.value = null;
    cachedAt.value = null;
    status.value = 'idle';
  }

  function loadFromCache() {
    const cached = loadCache();
    if (cached) {
      coords.value = { lat: cached.lat, lng: cached.lng };
      cachedAt.value = cached.cachedAt;
      status.value = 'granted';
    }
  }

  loadFromCache();

  return { coords, status, error, cachedAt, request, clearCache };
}

export function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function distanceLabel(km) {
  if (km == null) return '';
  const miles = km * 0.621371;
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
