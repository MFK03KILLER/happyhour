<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  pins: { type: Array, default: () => [] },
  center: { type: Object, default: () => ({ lat: 37.7749, lng: -122.4194 }) },
  zoom: { type: Number, default: 11 },
  dark: { type: Boolean, default: true },
});
const emit = defineEmits(['pin-click']);

const mapEl = ref(null);
let mapInstance = null;
let markerLayer = null;

function buildIcon(label, kind) {
  const color = kind === 'surprise_bag' ? '#FF6B5B' : '#0E5C5C';
  const html = `<div style="
    background:${color};color:white;padding:3px 10px;border-radius:9999px;
    font-weight:700;font-size:12px;font-family:Inter,sans-serif;
    box-shadow:0 4px 12px rgba(0,0,0,.35);white-space:nowrap;
    border:2px solid white;cursor:pointer;
  ">${label}</div>`;
  return L.divIcon({ html, className: '', iconSize: null, iconAnchor: [20, 14] });
}

function renderPins() {
  if (!mapInstance) return;
  if (markerLayer) markerLayer.clearLayers();
  markerLayer = L.layerGroup().addTo(mapInstance);
  props.pins.forEach((p) => {
    if (p.lat == null || p.lng == null) return;
    const marker = L.marker([p.lat, p.lng], { icon: buildIcon(p.label || '•', p.kind) });
    marker.on('click', () => emit('pin-click', p));
    if (p.popup) marker.bindPopup(p.popup);
    marker.addTo(markerLayer);
  });
}

onMounted(() => {
  mapInstance = L.map(mapEl.value, { zoomControl: true, attributionControl: true }).setView([props.center.lat, props.center.lng], props.zoom);
  const tileUrl = props.dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  L.tileLayer(tileUrl, { maxZoom: 19, attribution: '© OpenStreetMap, © CARTO' }).addTo(mapInstance);
  renderPins();
});

onBeforeUnmount(() => { if (mapInstance) mapInstance.remove(); });

watch(() => props.pins, renderPins, { deep: true });
</script>

<template>
  <div ref="mapEl" class="w-full h-full"></div>
</template>

<style>
.leaflet-container { background: #0F172A; }
.leaflet-control-attribution { font-size: 9px !important; opacity: 0.6; }
</style>
